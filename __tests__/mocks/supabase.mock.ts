/**
 * mocks/supabase.mock.ts
 *
 * A fully chainable Supabase query builder mock.
 * Implements the fluent API: .from().select().eq().gte()...
 * Call makeMockClient(rows) to get a client that resolves with those rows.
 */

export interface MockResult<T = any> {
  data:  T | null;
  error: null | { message: string; code: string };
  count: number | null;
}

/**
 * Builds a chainable query builder that resolves to { data, error }.
 */
export function makeQueryBuilder<T>(
  resolveWith: MockResult<T>,
): Record<string, jest.Mock> {
  const builder: Record<string, jest.Mock> = {};
  const chain   = () => builder;

  // All these methods return `this` for chaining
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gte', 'lte', 'gt', 'lt',
    'ilike', 'like', 'in', 'is',
    'order', 'limit', 'range',
  ];

  for (const method of chainMethods) {
    builder[method] = jest.fn(chain);
  }

  // Terminal method — resolves the promise
  builder.single = jest.fn(() => Promise.resolve({
    data:  Array.isArray(resolveWith.data) ? resolveWith.data[0] ?? null : resolveWith.data,
    error: resolveWith.error,
  }));

  // .then() makes the builder itself thenable (awaitable)
  (builder as any).then = (resolve: Function, reject: Function) =>
    Promise.resolve(resolveWith).then(resolve as any, reject as any);

  return builder;
}

/**
 * Creates a mock Supabase client where every .from() call returns
 * a chainable builder that resolves with the provided data.
 */
export function makeMockClient<T = any>(rows: T[], error?: { message: string }) {
  const result: MockResult<T[]> = {
    data:  error ? null : rows,
    error: error ? { message: error.message, code: 'PGRST000' } : null,
    count: error ? null : rows.length,
  };

  const from = jest.fn((_table?: string) => makeQueryBuilder(result));

  const auth = {
    getUser: jest.fn(() =>
      Promise.resolve({ data: { user: { id: 'user-abc', email: 'test@example.com' } }, error: null })
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  };

  const functions = {
    invoke: jest.fn(() => Promise.resolve({ data: { triggered: 1 }, error: null })),
  };

  return { from, auth, functions };
}

/**
 * Creates a mock that simulates a network/DB error.
 */
export function makeErrorClient(message = 'Network error') {
  return makeMockClient([], { message });
}

/**
 * Helper: assert that a Supabase query builder was called with a specific filter.
 */
export function assertFilter(
  builderMethod: jest.Mock,
  column: string,
  value: unknown,
) {
  expect(builderMethod).toHaveBeenCalledWith(column, value);
}
