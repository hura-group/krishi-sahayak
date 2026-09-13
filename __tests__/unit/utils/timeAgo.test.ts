/**
 * unit/utils/timeAgo.test.ts
 *
 * Tests every branch of the timeAgo() and formatAlertDate() utilities.
 * Uses jest.spyOn(Date, 'now') to make time deterministic.
 */

import { timeAgo, formatAlertDate } from '../../../apps/mobile/src/utils/timeAgo';

// Pin "now" to a fixed timestamp so tests don't drift
const NOW_ISO  = '2026-04-24T12:00:00.000Z';
const NOW_MS   = new Date(NOW_ISO).getTime();

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helper ───────────────────────────────────────────────────

function msAgo(ms: number): string {
  return new Date(NOW_MS - ms).toISOString();
}

function secsAgo(s: number)  { return msAgo(s * 1000);         }
function minsAgo(m: number)  { return secsAgo(m * 60);         }
function hoursAgo(h: number) { return minsAgo(h * 60);         }
function daysAgo(d: number)  { return hoursAgo(d * 24);        }

// ─── timeAgo() ────────────────────────────────────────────────

describe('timeAgo()', () => {
  describe('just now (< 60 seconds)', () => {
    it('returns "just now" for 0 seconds ago', () => {
      expect(timeAgo(msAgo(0))).toBe('just now');
    });
    it('returns "just now" for 30 seconds ago', () => {
      expect(timeAgo(secsAgo(30))).toBe('just now');
    });
    it('returns "just now" for 59 seconds ago', () => {
      expect(timeAgo(secsAgo(59))).toBe('just now');
    });
  });

  describe('minutes (60s – 3599s)', () => {
    it('returns "1 min ago" at exactly 60 seconds', () => {
      expect(timeAgo(secsAgo(60))).toBe('1 min ago');
    });
    it('returns "5 min ago" for 5 minutes ago', () => {
      expect(timeAgo(minsAgo(5))).toBe('5 min ago');
    });
    it('returns "59 min ago" at 59 minutes', () => {
      expect(timeAgo(minsAgo(59))).toBe('59 min ago');
    });
  });

  describe('hours (1h – 23h)', () => {
    it('returns "1 hr ago" at exactly 1 hour', () => {
      expect(timeAgo(hoursAgo(1))).toBe('1 hr ago');
    });
    it('uses singular "hr" for exactly 1 hour', () => {
      expect(timeAgo(hoursAgo(1))).toMatch(/^1 hr ago$/);
    });
    it('uses plural "hrs" for 2+ hours', () => {
      expect(timeAgo(hoursAgo(2))).toBe('2 hrs ago');
    });
    it('returns "23 hrs ago" at 23 hours', () => {
      expect(timeAgo(hoursAgo(23))).toBe('23 hrs ago');
    });
  });

  describe('days (1d – 6d)', () => {
    it('returns "1 day ago" at exactly 24 hours', () => {
      expect(timeAgo(daysAgo(1))).toBe('1 day ago');
    });
    it('uses singular "day" for 1 day', () => {
      expect(timeAgo(daysAgo(1))).toMatch(/^1 day ago$/);
    });
    it('uses plural "days" for 2+ days', () => {
      expect(timeAgo(daysAgo(3))).toBe('3 days ago');
    });
    it('returns "6 days ago" at 6 days', () => {
      expect(timeAgo(daysAgo(6))).toBe('6 days ago');
    });
  });

  describe('older than 7 days → formatted date', () => {
    it('returns formatted date for 7 days ago', () => {
      const result = timeAgo(daysAgo(7));
      // Should NOT contain "ago"
      expect(result).not.toMatch(/ago/);
      // Should contain month abbreviation
      expect(result).toMatch(/[A-Za-z]{3}/);
    });
    it('returns formatted date for 30 days ago', () => {
      const result = timeAgo(daysAgo(30));
      expect(result).not.toMatch(/ago/);
    });
  });

  describe('edge cases', () => {
    it('handles future timestamps gracefully (returns "just now")', () => {
      const future = new Date(NOW_MS + 5000).toISOString();
      // sec will be negative; floor → -1 which is < 60 so returns "just now"
      expect(timeAgo(future)).toBe('just now');
    });
  });
});

// ─── formatAlertDate() ────────────────────────────────────────

describe('formatAlertDate()', () => {
  it('returns a string containing a weekday', () => {
    const result = formatAlertDate('2026-04-20T08:30:00Z');
    // en-IN weekday abbreviations: Mon, Tue, etc.
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });

  it('returns a string containing the month', () => {
    const result = formatAlertDate('2026-04-20T08:30:00Z');
    expect(result).toMatch(/Apr/);
  });

  it('returns a string containing AM or PM', () => {
    const result = formatAlertDate('2026-04-20T08:30:00Z');
    expect(result).toMatch(/AM|PM|am|pm/i);
  });
});
