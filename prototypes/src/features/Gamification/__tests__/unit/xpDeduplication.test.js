/**
 * __tests__/unit/xpDeduplication.test.js
 *
 * Unit tests for XP event deduplication logic.
 * All Supabase calls are mocked — zero network traffic.
 *
 * Covers:
 *   ✓ New unique event → XP granted
 *   ✓ Same eventId replayed → skipped (duplicate_event)
 *   ✓ Zero-XP action → skipped (zero_xp_action)
 *   ✓ Race condition (concurrent identical events) → only one XP grant
 *   ✓ Same action, different eventId → both granted (different events)
 *   ✓ DB error during insert → propagated, XP not granted
 *   ✓ DB error during RPC → event row compensated (deleted), error rethrown
 *   ✓ Batch processor totals correctly, respects per-event deduplication
 *   ✓ computeRank — DENSE_RANK semantics with ties
 *   ✓ xpGapToNextRank — correct gap for mid-list and top-ranked user
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processXPEvent,
  processBatchXPEvents,
  computeRank,
  xpGapToNextRank,
  XP_REWARDS,
} from "../../utils/xpEventProcessor";
import { createMockSupabase } from "../helpers/mockSupabase";
import { makeXPEvent }        from "../helpers/testFactories";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUniqueEvent(overrides = {}) {
  return makeXPEvent({
    eventId:  `evt-unique-${Math.random().toString(36).slice(2)}`,
    userId:   "user-123",
    action:   "scan",
    xpAmount: XP_REWARDS.scan,
    ...overrides,
  });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("XP Event Deduplication", () => {
  let sb;

  beforeEach(() => {
    sb = createMockSupabase();
    // Default: insert succeeds (no conflict)
    sb.__setQueryResult("xp_events", { data: { id: "evt-1" }, error: null });
    sb.rpc.mockResolvedValue({ data: null, error: null });
  });

  // ── Happy path ──────────────────────────────────────────────────────────

  it("grants XP for a new unique event", async () => {
    const event  = makeUniqueEvent({ xpAmount: 10 });
    const result = await processXPEvent(sb, event);

    expect(result.skipped).toBe(false);
    expect(result.xpGranted).toBe(10);
    expect(result.eventId).toBe(event.eventId);

    // Verify XP RPC was called with the correct args
    expect(sb.rpc).toHaveBeenCalledWith("increment_user_xp", {
      p_user_id: event.userId,
      p_amount:  10,
    });
  });

  it("records the event in xp_events table on first call", async () => {
    const event = makeUniqueEvent();
    await processXPEvent(sb, event);

    expect(sb.from).toHaveBeenCalledWith("xp_events");
  });

  // ── Deduplication ────────────────────────────────────────────────────────

  it("skips and returns 'duplicate_event' when the same eventId is replayed", async () => {
    sb.__simulateDuplicateKey("xp_events");

    const event  = makeUniqueEvent();
    const result = await processXPEvent(sb, event);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("duplicate_event");

    // XP RPC must NOT have been called
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it("skips 'zero_xp_action' without hitting the database", async () => {
    const event  = makeUniqueEvent({ xpAmount: 0 });
    const result = await processXPEvent(sb, event);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("zero_xp_action");
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("grants XP for different eventIds with the same action type", async () => {
    const event1 = makeUniqueEvent({ eventId: "evt-aaa", xpAmount: 10 });
    const event2 = makeUniqueEvent({ eventId: "evt-bbb", xpAmount: 10 });

    const r1 = await processXPEvent(sb, event1);
    const r2 = await processXPEvent(sb, event2);

    expect(r1.skipped).toBe(false);
    expect(r2.skipped).toBe(false);
    expect(sb.rpc).toHaveBeenCalledTimes(2);
  });

  // ── Race condition simulation ─────────────────────────────────────────────

  it("handles concurrent duplicate events: exactly one XP grant wins", async () => {
    // Simulate: first call inserts OK, second gets unique violation
    const insertMock = vi.fn()
      .mockResolvedValueOnce({ data: { id: "evt-race" }, error: null })
      .mockResolvedValueOnce({
        data:  null,
        error: { code: "23505", message: "duplicate key" },
      });

    sb.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      then:   (r) => Promise.resolve({ data: null, error: null }).then(r),
    });

    const event = makeUniqueEvent({ eventId: "evt-race" });

    // Fire both concurrently
    const [r1, r2] = await Promise.all([
      processXPEvent(sb, event),
      processXPEvent(sb, event),
    ]);

    const granted = [r1, r2].filter((r) => !r.skipped);
    const skipped = [r1, r2].filter((r) =>  r.skipped);

    expect(granted).toHaveLength(1);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toBe("duplicate_event");
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it("propagates unexpected DB errors from xp_events insert", async () => {
    sb.__setQueryResult("xp_events", {
      data:  null,
      error: { code: "42P01", message: "relation xp_events does not exist" },
    });

    await expect(processXPEvent(sb, makeUniqueEvent()))
      .rejects.toMatchObject({ code: "42P01" });

    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it("compensates (deletes event row) and rethrows if XP RPC fails", async () => {
    sb.rpc.mockResolvedValueOnce({
      data:  null,
      error: { message: "RPC failed" },
    });

    const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() });
    sb.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: "evt-x" }, error: null }),
      delete: deleteMock,
      eq:     vi.fn().mockReturnThis(),
    });

    await expect(processXPEvent(sb, makeUniqueEvent()))
      .rejects.toMatchObject({ message: "RPC failed" });

    // Delete should have been called to compensate
    expect(deleteMock).toHaveBeenCalled();
  });
});

// ─── Batch processor ─────────────────────────────────────────────────────────

describe("processBatchXPEvents", () => {
  it("sums XP correctly across multiple new events", async () => {
    const sb = createMockSupabase();
    sb.__setQueryResult("xp_events", { data: {}, error: null });
    sb.rpc.mockResolvedValue({ data: null, error: null });

    const events = [
      makeXPEvent({ eventId: "e1", xpAmount: 10 }),
      makeXPEvent({ eventId: "e2", xpAmount: 5  }),
      makeXPEvent({ eventId: "e3", xpAmount: 20 }),
    ];

    const { totalGranted, results } = await processBatchXPEvents(sb, events);

    expect(totalGranted).toBe(35);
    expect(results.every((r) => !r.skipped)).toBe(true);
  });

  it("excludes skipped (duplicate) events from total", async () => {
    const sb = createMockSupabase();

    // First event inserts OK, second is a duplicate
    let callCount = 0;
    sb.from.mockImplementation(() => ({
      insert: vi.fn().mockImplementation(() => {
        callCount++;
        const isDup = callCount === 2;
        return Promise.resolve({
          data:  isDup ? null : {},
          error: isDup ? { code: "23505" } : null,
        });
      }),
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }));
    sb.rpc.mockResolvedValue({ data: null, error: null });

    const events = [
      makeXPEvent({ eventId: "e1", xpAmount: 10 }),
      makeXPEvent({ eventId: "e1", xpAmount: 10 }), // duplicate
    ];

    const { totalGranted, results } = await processBatchXPEvents(sb, events);

    expect(totalGranted).toBe(10);
    expect(results[1].skipped).toBe(true);
    expect(results[1].reason).toBe("duplicate_event");
  });
});

// ─── Rank utilities ──────────────────────────────────────────────────────────

describe("computeRank", () => {
  const leaderboard = [
    { userId: "alice",   xp: 5000 },
    { userId: "bob",     xp: 4000 },
    { userId: "charlie", xp: 4000 }, // tie with bob → same rank
    { userId: "diana",   xp: 2000 },
    { userId: "evan",    xp: 1000 },
  ];

  it("returns 1 for the top-ranked user", () => {
    expect(computeRank(leaderboard, "alice")).toBe(1);
  });

  it("handles DENSE_RANK ties correctly", () => {
    expect(computeRank(leaderboard, "bob")).toBe(2);
    expect(computeRank(leaderboard, "charlie")).toBe(2);
  });

  it("returns the correct rank after a tie group", () => {
    expect(computeRank(leaderboard, "diana")).toBe(4);
    expect(computeRank(leaderboard, "evan")).toBe(5);
  });

  it("returns -1 for a user not in the list", () => {
    expect(computeRank(leaderboard, "nobody")).toBe(-1);
  });

  it("returns 1 for a single-user leaderboard", () => {
    expect(computeRank([{ userId: "solo", xp: 100 }], "solo")).toBe(1);
  });
});

describe("xpGapToNextRank", () => {
  const leaderboard = [
    { userId: "u1", xp: 1000 },
    { userId: "u2", xp: 990  },
    { userId: "u3", xp: 980  },
  ];

  it("returns 0 for the top-ranked user", () => {
    expect(xpGapToNextRank(leaderboard, "u1")).toBe(0);
  });

  it("returns the correct gap for second place", () => {
    expect(xpGapToNextRank(leaderboard, "u2")).toBe(10);
  });

  it("returns the correct gap for third place", () => {
    expect(xpGapToNextRank(leaderboard, "u3")).toBe(10);
  });

  it("returns 0 for a user not in the list", () => {
    expect(xpGapToNextRank(leaderboard, "nobody")).toBe(0);
  });

  it("detects the 'Almost There' condition (gap ≤ 10 XP)", () => {
    const gap = xpGapToNextRank(leaderboard, "u2");
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThanOrEqual(10);
  });
});
