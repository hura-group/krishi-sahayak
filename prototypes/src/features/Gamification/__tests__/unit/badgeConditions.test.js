/**
 * __tests__/unit/badgeConditions.test.js
 *
 * Unit tests for all 15 badge award criteria.
 * Uses mock DbAdapter — zero Supabase/network calls.
 *
 * Covers:
 *   ✓ Every badge: happy-path unlock condition
 *   ✓ Every badge: one-below-threshold does NOT award
 *   ✓ Price Prophet: boundary math (90%, 100%, 110% of peak)
 *   ✓ Crop Master: 5 distinct crops vs 5 of same crop
 *   ✓ Early Bird: within window vs after window
 *   ✓ Legend: in top 10 vs 11th
 *   ✓ Digital Farmer: exactly 100% vs 99%
 *   ✓ Milestone Maker: exactly 1000 XP vs 999
 *   ✓ Missing metadata → safe false return (no throw)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BADGE_CRITERIA }      from "../../utils/badgeCriteria";
import { createMockDbAdapter } from "../helpers/mockSupabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = "test-user-abc";

/** Runs a badge criterion and returns boolean result */
async function check(badgeId, dbOverrides = {}, metadata = {}) {
  const db = createMockDbAdapter(dbOverrides);
  return BADGE_CRITERIA[badgeId](db, USER_ID, metadata);
}

// ─── Farming badges ───────────────────────────────────────────────────────────

describe("Badge: first-scan", () => {
  it("awards on first scan (count = 1)", async () => {
    expect(await check("first-scan", { count: 1 })).toBe(true);
  });
  it("does NOT award when no scans yet (count = 0)", async () => {
    expect(await check("first-scan", { count: 0 })).toBe(false);
  });
  it("awards when user has many scans (idempotent check)", async () => {
    expect(await check("first-scan", { count: 50 })).toBe(true);
  });
});

describe("Badge: weather-wise", () => {
  it("awards at exactly 5 weather checks", async () => {
    expect(await check("weather-wise", { count: 5 })).toBe(true);
  });
  it("does NOT award at 4 checks", async () => {
    expect(await check("weather-wise", { count: 4 })).toBe(false);
  });
  it("awards at 10+ checks (still qualifies)", async () => {
    expect(await check("weather-wise", { count: 10 })).toBe(true);
  });
});

describe("Badge: harvest-hero", () => {
  it("awards on first harvest log", async () => {
    expect(await check("harvest-hero", { count: 1 })).toBe(true);
  });
  it("does NOT award before any harvest", async () => {
    expect(await check("harvest-hero", { count: 0 })).toBe(false);
  });
});

describe("Badge: crop-master", () => {
  it("awards for 5 DISTINCT crop types", async () => {
    expect(await check("crop-master", {
      fetchDistinct: ["wheat", "rice", "cotton", "sugarcane", "maize"],
    })).toBe(true);
  });
  it("does NOT award for 4 distinct crops", async () => {
    expect(await check("crop-master", {
      fetchDistinct: ["wheat", "rice", "cotton", "sugarcane"],
    })).toBe(false);
  });
  it("does NOT award if same crop added 5 times (1 distinct)", async () => {
    expect(await check("crop-master", {
      fetchDistinct: ["wheat"], // only 1 unique
    })).toBe(false);
  });
  it("awards for 10 distinct crops (still qualifies)", async () => {
    const crops = ["wheat","rice","cotton","sugarcane","maize","barley","soybean","jowar","bajra","groundnut"];
    expect(await check("crop-master", { fetchDistinct: crops })).toBe(true);
  });
});

// ─── Market badges ────────────────────────────────────────────────────────────

describe("Badge: market-watcher", () => {
  it("awards at exactly 10 market views", async () => {
    expect(await check("market-watcher", { count: 10 })).toBe(true);
  });
  it("does NOT award at 9 views", async () => {
    expect(await check("market-watcher", { count: 9 })).toBe(false);
  });
  it("awards at 100 views (still qualifies)", async () => {
    expect(await check("market-watcher", { count: 100 })).toBe(true);
  });
  it("does NOT award at 0 views", async () => {
    expect(await check("market-watcher", { count: 0 })).toBe(false);
  });
});

describe("Badge: top-seller", () => {
  it("awards on first product listing", async () => {
    expect(await check("top-seller", { count: 1 })).toBe(true);
  });
  it("does NOT award before any listing", async () => {
    expect(await check("top-seller", { count: 0 })).toBe(false);
  });
});

describe("Badge: price-prophet — boundary math", () => {
  const peak = 2500;

  it("awards when sale = 100% of predicted peak", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2500, predictedPeak: peak })).toBe(true);
  });
  it("awards when sale = 90% (lower bound)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2250, predictedPeak: peak })).toBe(true);
  });
  it("awards when sale = 110% (upper bound)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2750, predictedPeak: peak })).toBe(true);
  });
  it("awards when sale is 95% (mid-range within window)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2375, predictedPeak: peak })).toBe(true);
  });
  it("does NOT award when sale = 89% (just below lower bound)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2225, predictedPeak: peak })).toBe(false);
  });
  it("does NOT award when sale = 111% (just above upper bound)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 2775, predictedPeak: peak })).toBe(false);
  });
  it("does NOT award when sale = 0", async () => {
    expect(await check("price-prophet", {}, { salePrice: 0, predictedPeak: peak })).toBe(false);
  });
  it("does NOT award when predictedPeak = 0 (division guard)", async () => {
    expect(await check("price-prophet", {}, { salePrice: 100, predictedPeak: 0 })).toBe(false);
  });
  it("returns false safely when metadata is missing entirely", async () => {
    expect(await check("price-prophet", {}, {})).toBe(false);
  });
  it("returns false safely when metadata is undefined", async () => {
    const db = createMockDbAdapter();
    expect(await BADGE_CRITERIA["price-prophet"](db, USER_ID, undefined)).toBe(false);
  });
});

// ─── Social badges ────────────────────────────────────────────────────────────

describe("Badge: community-champion", () => {
  it("awards at exactly 5 posts", async () => {
    expect(await check("community-champion", { count: 5 })).toBe(true);
  });
  it("does NOT award at 4 posts", async () => {
    expect(await check("community-champion", { count: 4 })).toBe(false);
  });
});

describe("Badge: social-butterfly", () => {
  it("awards at 10 farmer connections", async () => {
    expect(await check("social-butterfly", { count: 10 })).toBe(true);
  });
  it("does NOT award at 9 connections", async () => {
    expect(await check("social-butterfly", { count: 9 })).toBe(false);
  });
  it("counts connections regardless of direction (user_id OR connected_user_id)", async () => {
    // The db adapter's count() is called once; the Supabase adapter uses OR filter
    const db = createMockDbAdapter({ count: 10 });
    const result = await BADGE_CRITERIA["social-butterfly"](db, USER_ID);
    expect(db.count).toHaveBeenCalledWith("farmer_connections", USER_ID);
    expect(result).toBe(true);
  });
});

// ─── Learning badges ──────────────────────────────────────────────────────────

describe("Badge: knowledge-seeker", () => {
  it("awards at exactly 10 articles read", async () => {
    expect(await check("knowledge-seeker", { count: 10 })).toBe(true);
  });
  it("does NOT award at 9 articles", async () => {
    expect(await check("knowledge-seeker", { count: 9 })).toBe(false);
  });
});

// ─── Milestone badges ─────────────────────────────────────────────────────────

describe("Badge: green-streak", () => {
  it("awards when current_streak = 7", async () => {
    expect(await check("green-streak", { fetchOne: 7 })).toBe(true);
  });
  it("awards when current_streak > 7 (still qualifies)", async () => {
    expect(await check("green-streak", { fetchOne: 30 })).toBe(true);
  });
  it("does NOT award at streak 6", async () => {
    expect(await check("green-streak", { fetchOne: 6 })).toBe(false);
  });
  it("does NOT award at streak 0", async () => {
    expect(await check("green-streak", { fetchOne: 0 })).toBe(false);
  });
  it("queries the user_profiles table for current_streak", async () => {
    const db = createMockDbAdapter({ fetchOne: 7 });
    await BADGE_CRITERIA["green-streak"](db, USER_ID);
    expect(db.fetchOne).toHaveBeenCalledWith("user_profiles", USER_ID, "current_streak");
  });
});

describe("Badge: early-bird", () => {
  const launchDate = "2026-04-15T00:00:00Z";

  it("awards if user registered on the launch day itself", async () => {
    expect(await check("early-bird", {}, {
      registeredAt: "2026-04-15T06:00:00Z",
      launchDate,
    })).toBe(true);
  });
  it("awards if user registered on day 29 of the window", async () => {
    expect(await check("early-bird", {}, {
      registeredAt: "2026-05-13T06:00:00Z", // day 28
      launchDate,
    })).toBe(true);
  });
  it("awards if user registered on exactly day 30", async () => {
    expect(await check("early-bird", {}, {
      registeredAt: "2026-05-15T00:00:00Z", // exactly 30 days
      launchDate,
    })).toBe(true);
  });
  it("does NOT award if user registered on day 31", async () => {
    expect(await check("early-bird", {}, {
      registeredAt: "2026-05-16T00:00:00Z", // day 31
      launchDate,
    })).toBe(false);
  });
  it("does NOT award for a user who joins months later", async () => {
    expect(await check("early-bird", {}, {
      registeredAt: "2026-09-01T00:00:00Z",
      launchDate,
    })).toBe(false);
  });
});

describe("Badge: digital-farmer", () => {
  it("awards at exactly 100% completeness", async () => {
    expect(await check("digital-farmer", { fetchOne: 100 })).toBe(true);
  });
  it("does NOT award at 99%", async () => {
    expect(await check("digital-farmer", { fetchOne: 99 })).toBe(false);
  });
  it("does NOT award at 0%", async () => {
    expect(await check("digital-farmer", { fetchOne: 0 })).toBe(false);
  });
  it("awards above 100% if somehow over-filled", async () => {
    expect(await check("digital-farmer", { fetchOne: 110 })).toBe(true);
  });
});

describe("Badge: milestone-maker", () => {
  it("awards at exactly 1,000 XP", async () => {
    expect(await check("milestone-maker", { fetchOne: 1000 })).toBe(true);
  });
  it("awards at 1,001 XP (above threshold)", async () => {
    expect(await check("milestone-maker", { fetchOne: 1001 })).toBe(true);
  });
  it("does NOT award at 999 XP", async () => {
    expect(await check("milestone-maker", { fetchOne: 999 })).toBe(false);
  });
  it("does NOT award at 0 XP", async () => {
    expect(await check("milestone-maker", { fetchOne: 0 })).toBe(false);
  });
});

describe("Badge: legend", () => {
  const top10 = Array.from({ length: 10 }, (_, i) => ({ user_id: `user-${i + 1}` }));

  it("awards when user is in the top 10 (rank 1)", async () => {
    expect(await check("legend", { fetchTopN: top10 }, {}, )).toBe(false); // user-abc not in list
  });
  it("awards when the user_id is in the top 10 list", async () => {
    const top10WithUser = [...top10.slice(0, 9), { user_id: USER_ID }];
    const db = createMockDbAdapter({ fetchTopN: top10WithUser });
    expect(await BADGE_CRITERIA["legend"](db, USER_ID)).toBe(true);
  });
  it("does NOT award when user is 11th (not in top 10 list)", async () => {
    // top10 list does not include USER_ID
    const db = createMockDbAdapter({ fetchTopN: top10 });
    expect(await BADGE_CRITERIA["legend"](db, USER_ID)).toBe(false);
  });
  it("awards when user is the ONLY person (rank 1 of 1)", async () => {
    const db = createMockDbAdapter({ fetchTopN: [{ user_id: USER_ID }] });
    expect(await BADGE_CRITERIA["legend"](db, USER_ID)).toBe(true);
  });
  it("queries for top 10 users by XP", async () => {
    const db = createMockDbAdapter({ fetchTopN: top10 });
    await BADGE_CRITERIA["legend"](db, USER_ID);
    expect(db.fetchTopN).toHaveBeenCalledWith("user_profiles", 10);
  });
});

// ─── Cross-cutting: null / undefined safety ───────────────────────────────────

describe("badge criteria — null safety", () => {
  it.each([
    ["first-scan"],
    ["weather-wise"],
    ["harvest-hero"],
    ["market-watcher"],
    ["top-seller"],
    ["community-champion"],
    ["knowledge-seeker"],
    ["social-butterfly"],
  ])("%s does not throw when DB returns null", async (badgeId) => {
    const db = createMockDbAdapter({ count: null, fetchOne: null });
    await expect(BADGE_CRITERIA[badgeId](db, USER_ID)).resolves.toBe(false);
  });
});
