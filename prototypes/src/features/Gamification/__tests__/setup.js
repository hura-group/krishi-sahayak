// src/features/Gamification/__tests__/setup.js
// ─────────────────────────────────────────────
// Runs before EACH test file.
// Resets all mocks, patches global APIs used by the code under test.

import { vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom";

// Patch localStorage (jsdom has it but some CI environments don't)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Patch Intl.DateTimeFormat so test dates behave deterministically
// (the real implementation is used — we just need a stable clock in some tests)
globalThis.__TEST_NOW__ = null; // override with vi.setSystemTime() per-test

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

afterEach(() => {
  vi.useRealTimers();
});
