/**
 * __tests__/helpers/mockSupabase.js
 *
 * Creates a fully-typed, chainable Supabase mock.
 * Every method is a vi.fn() so tests can assert calls and override return values.
 *
 * Usage:
 *   const sb = createMockSupabase();
 *   sb.__setQueryResult("user_profiles", { data: { total_xp: 1500 }, error: null });
 *   const result = await sb.from("user_profiles").select("total_xp").eq("user_id","x").single();
 */

import { vi } from "vitest";

// ─── Query builder mock ───────────────────────────────────────────────────────

/**
 * Creates a mock query builder that is chainable and resolves to `resolveWith`.
 * @param {{ data: any, error: any, count?: number }} resolveWith
 */
function makeQueryBuilder(resolveWith = { data: null, error: null }) {
  const builder = {
    select:   vi.fn().mockReturnThis(),
    insert:   vi.fn().mockReturnThis(),
    update:   vi.fn().mockReturnThis(),
    upsert:   vi.fn().mockReturnThis(),
    delete:   vi.fn().mockReturnThis(),
    eq:       vi.fn().mockReturnThis(),
    neq:      vi.fn().mockReturnThis(),
    in:       vi.fn().mockReturnThis(),
    or:       vi.fn().mockReturnThis(),
    order:    vi.fn().mockReturnThis(),
    limit:    vi.fn().mockReturnThis(),
    single:   vi.fn().mockResolvedValue(resolveWith),
    then:     (resolve) => Promise.resolve(resolveWith).then(resolve),
    // Spread so `await sb.from().select()` works directly
    [Symbol.toStringTag]: "MockQueryBuilder",
  };
  // Make the builder itself awaitable
  builder.then = (resolve) => Promise.resolve(resolveWith).then(resolve);
  return builder;
}

// ─── Main factory ─────────────────────────────────────────────────────────────

/**
 * @returns {ReturnType<typeof createMockSupabase>}
 */
export function createMockSupabase() {
  // Table-level response overrides: tableName → resolve value
  const tableResponses = new Map();

  const supabase = {
    // ── Query builder ──────────────────────────────────────────────────────
    from: vi.fn((table) => {
      const response = tableResponses.get(table) ?? { data: null, error: null };
      return makeQueryBuilder(response);
    }),

    // ── RPC ────────────────────────────────────────────────────────────────
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),

    // ── Auth ───────────────────────────────────────────────────────────────
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-uuid", email: "test@farm.in" } },
        error: null,
      }),
    },

    // ── Realtime ───────────────────────────────────────────────────────────
    channel: vi.fn().mockReturnValue({
      on:          vi.fn().mockReturnThis(),
      subscribe:   vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),

    // ── Edge Functions ─────────────────────────────────────────────────────
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { awarded: [] }, error: null }),
    },

    // ── Test helpers (not on real Supabase client) ─────────────────────────

    /** Override what `from(table)` resolves with for the next call */
    __setQueryResult: (table, response) => {
      tableResponses.set(table, response);
    },

    /** Clear all table overrides */
    __resetQueryResults: () => {
      tableResponses.clear();
    },

    /** Make the next rpc() call return a specific value */
    __setRpcResult: (value) => {
      supabase.rpc.mockResolvedValueOnce(value);
    },

    /** Simulate a Postgres unique violation on the next from() insert */
    __simulateDuplicateKey: (table) => {
      tableResponses.set(table, {
        data:  null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });
    },
  };

  return supabase;
}

// ─── Mock DbAdapter factory ───────────────────────────────────────────────────

/**
 * Creates a mock DbAdapter (used for badgeCriteria.js tests).
 * Provide per-method return values via the `overrides` map.
 *
 * @param {{
 *   count?:         number,
 *   fetchOne?:      any,
 *   fetchDistinct?: string[],
 *   fetchTopN?:     { user_id: string }[],
 * }} defaults
 */
export function createMockDbAdapter(defaults = {}) {
  return {
    count:         vi.fn().mockResolvedValue(defaults.count ?? 0),
    fetchOne:      vi.fn().mockResolvedValue(defaults.fetchOne ?? null),
    fetchDistinct: vi.fn().mockResolvedValue(defaults.fetchDistinct ?? []),
    fetchTopN:     vi.fn().mockResolvedValue(defaults.fetchTopN ?? []),
  };
}
