// Stub for apps/mobile/src/lib/supabase.ts (UTF-16 encoded — unparseable by Jest)
// Tests that need controlled DB responses should mock this module directly.

export const supabase = {
  from:      jest.fn(),
  auth:      { getUser: jest.fn(), signOut: jest.fn() },
  functions: { invoke: jest.fn() },
};
