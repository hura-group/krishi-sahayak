/**
 * unit/services/mandiLocator.test.ts
 *
 * Tests pure functions in mandiLocatorService:
 *   - haversineKm()
 *   - isMandiOpenNow()
 *   - buildDirectionsUrl()
 *
 * No Supabase calls. Uses fake timers to control time-of-day.
 */

// Block the UTF-16 mobile supabase client from loading — mandiLocator pure functions don't need it
jest.mock('../../../apps/mobile/src/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getUser: jest.fn() }, functions: { invoke: jest.fn() } },
}), { virtual: true });

jest.mock('expo-secure-store', () => ({}), { virtual: true });
jest.mock('react-native', () => ({ Linking: { openURL: jest.fn() }, Platform: { OS: 'ios' } }), { virtual: true });

import {
  haversineKm,
  isMandiOpenNow,
  buildDirectionsUrl,
  OperatingHours,
} from '../../../apps/mobile/src/services/mandiLocatorService';

// ─── haversineKm() ────────────────────────────────────────────

describe('haversineKm()', () => {
  it('returns 0 for the same coordinate', () => {
    expect(haversineKm(23.0069, 72.5639, 23.0069, 72.5639)).toBe(0);
  });

  it('calculates Mumbai → Delhi ≈ 1140–1160 km', () => {
    // Mumbai: 19.0760, 72.8777 | Delhi: 28.7041, 77.1025
    const dist = haversineKm(19.0760, 72.8777, 28.7041, 77.1025);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });

  it('calculates Ahmedabad → Rajkot ≈ 200–220 km', () => {
    const dist = haversineKm(23.0069, 72.5639, 22.2950, 70.7861);
    expect(dist).toBeGreaterThan(180);
    expect(dist).toBeLessThan(240);
  });

  it('is symmetric — A→B = B→A', () => {
    const ab = haversineKm(23.0069, 72.5639, 22.2950, 70.7861);
    const ba = haversineKm(22.2950, 70.7861, 23.0069, 72.5639);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });

  it('returns a positive number for different coordinates', () => {
    expect(haversineKm(0, 0, 1, 1)).toBeGreaterThan(0);
  });

  it('handles coordinates across hemispheres', () => {
    const dist = haversineKm(0, 0, 0, 180);
    // Half equator ≈ 20015 km
    expect(dist).toBeGreaterThan(19000);
    expect(dist).toBeLessThan(21000);
  });
});

// ─── isMandiOpenNow() ─────────────────────────────────────────

/**
 * Helper: set the system clock to a specific day/time for testing open hours.
 * day: 0=Sun, 1=Mon, ..., 6=Sat
 */
function mockTime(day: number, hour: number, minute = 0) {
  // Build a date for a specific weekday in a known week
  // 2026-04-20 is a Monday (day=1)
  const base = new Date('2026-04-20T00:00:00.000Z'); // Monday
  const diff  = day - 1; // adjust relative to Monday
  const d     = new Date(base);
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  jest.setSystemTime(d);
}

describe('isMandiOpenNow()', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const NORMAL_HOURS: OperatingHours = {
    weekdays: '6:00 AM – 2:00 PM',
    sunday:   'Closed',
  };

  const SUNDAY_HOURS: OperatingHours = {
    weekdays: '5:30 AM – 1:00 PM',
    sunday:   '7:00 AM – 11:00 AM',
  };

  // ── Weekday tests ─────────────────────────────────────────────
  describe('weekday schedule', () => {
    it('returns true at 9:00 AM on a Monday (inside hours)', () => {
      mockTime(1, 9, 0);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(true);
    });

    it('returns true at exactly 6:00 AM (opening time, inclusive)', () => {
      mockTime(1, 6, 0);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(true);
    });

    it('returns false at 5:59 AM (one minute before opening)', () => {
      mockTime(1, 5, 59);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(false);
    });

    it('returns false at exactly 2:00 PM (closing time, exclusive)', () => {
      mockTime(1, 14, 0);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(false);
    });

    it('returns true at 1:59 PM (one minute before close)', () => {
      mockTime(1, 13, 59);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(true);
    });

    it('returns false at 3:00 PM (after closing time)', () => {
      mockTime(1, 15, 0);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(false);
    });

    it('returns false at midnight', () => {
      mockTime(2, 0, 0);
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(false);
    });
  });

  // ── Sunday tests ──────────────────────────────────────────────
  describe('sunday schedule', () => {
    it('returns false when sunday is "Closed"', () => {
      mockTime(0, 10, 0); // Sunday 10 AM
      expect(isMandiOpenNow(NORMAL_HOURS)).toBe(false);
    });

    it('returns true at 9:00 AM on Sunday (open schedule)', () => {
      mockTime(0, 9, 0);
      expect(isMandiOpenNow(SUNDAY_HOURS)).toBe(true);
    });

    it('returns false before Sunday opening (6:59 AM)', () => {
      mockTime(0, 6, 59);
      expect(isMandiOpenNow(SUNDAY_HOURS)).toBe(false);
    });

    it('returns false at Sunday closing time (11:00 AM, exclusive)', () => {
      mockTime(0, 11, 0);
      expect(isMandiOpenNow(SUNDAY_HOURS)).toBe(false);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles PM hours like "5:30 AM – 1:00 PM" correctly', () => {
      mockTime(1, 12, 30); // 12:30 PM — inside 5:30 AM – 1:00 PM
      expect(isMandiOpenNow(SUNDAY_HOURS)).toBe(true);
    });

    it('returns false for malformed schedule string', () => {
      const bad: OperatingHours = { weekdays: 'Call for hours', sunday: 'Closed' };
      mockTime(1, 9, 0);
      expect(isMandiOpenNow(bad)).toBe(false);
    });

    it('returns false when schedule is empty string', () => {
      const empty: OperatingHours = { weekdays: '', sunday: '' };
      mockTime(1, 9, 0);
      expect(isMandiOpenNow(empty)).toBe(false);
    });
  });
});

// ─── buildDirectionsUrl() ────────────────────────────────────

describe('buildDirectionsUrl()', () => {
  const destLat  = 23.0069;
  const destLng  = 72.5639;
  const mandiName = 'Ahmedabad APMC';
  const userLat  = 23.1000;
  const userLng  = 72.6000;

  it('returns a Google Maps URL', () => {
    const url = buildDirectionsUrl(destLat, destLng, mandiName);
    expect(url).toContain('google.com/maps');
  });

  it('includes destination coordinates in the URL', () => {
    const url = buildDirectionsUrl(destLat, destLng, mandiName);
    expect(url).toContain(String(destLat));
    expect(url).toContain(String(destLng));
  });

  it('uses dir/ endpoint when user location is provided', () => {
    const url = buildDirectionsUrl(destLat, destLng, mandiName, userLat, userLng);
    expect(url).toContain('/maps/dir/');
    expect(url).toContain('travelmode=driving');
  });

  it('includes origin coordinates when user location is provided', () => {
    const url = buildDirectionsUrl(destLat, destLng, mandiName, userLat, userLng);
    expect(url).toContain(`origin=${userLat},${userLng}`);
  });

  it('uses search/ endpoint when user location is not provided', () => {
    const url = buildDirectionsUrl(destLat, destLng, mandiName);
    expect(url).toContain('/maps/search/');
  });

  it('URL-encodes the mandi name', () => {
    const nameWithSpaces = 'Ahmedabad APMC Market';
    const url = buildDirectionsUrl(destLat, destLng, nameWithSpaces);
    expect(url).toContain(encodeURIComponent(nameWithSpaces));
  });
});
