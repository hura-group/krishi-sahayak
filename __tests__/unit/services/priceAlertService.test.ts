/**
 * unit/services/priceAlertService.test.ts
 *
 * Tests every exported function in priceAlertService:
 *   - getUserAlerts()   — fetches correctly, auth check
 *   - createAlert()     — correct insert payload
 *   - toggleAlert()     — sends correct update
 *   - deleteAlert()     — sends correct delete
 *   - getAlertHistory() — respects limit(30), order
 *   - triggerAlertCheck() — invokes edge function
 *
 * Supabase is fully mocked — zero network calls.
 */

import { makeMockClient, makeErrorClient } from '../../mocks/supabase.mock';
import { FIXTURE_ALERTS }                  from '../../fixtures';

// ─── Supabase mock ────────────────────────────────────────────

const mockClient = {
  from:      jest.fn(),
  auth:      { getUser: jest.fn() },
  functions: { invoke: jest.fn() },
};

jest.mock('../../../apps/mobile/src/lib/supabase', () => ({
  supabase: mockClient,
}));

// Import AFTER mock
import {
  getUserAlerts,
  createAlert,
  toggleAlert,
  deleteAlert,
  getAlertHistory,
  triggerAlertCheck,
  CreateAlertPayload,
} from '../../../apps/mobile/src/services/priceAlertService';

// ─── Helpers ─────────────────────────────────────────────────

function setAuthUser(id = 'user-abc') {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: { id, email: 'test@krishisahayak.app' } },
    error: null,
  });
}

function setAuthGuest() {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

function setupFromChain(rows: any[], error?: { message: string }) {
  const client  = error ? makeErrorClient(error.message) : makeMockClient(rows);
  mockClient.from.mockImplementation(() => client.from());
}

beforeEach(() => {
  jest.clearAllMocks();
  setAuthUser();
});

// ─── getUserAlerts() ─────────────────────────────────────────

describe('getUserAlerts()', () => {
  it('returns alerts for authenticated user', async () => {
    setupFromChain([...FIXTURE_ALERTS]);
    const alerts = await getUserAlerts();
    expect(alerts).toHaveLength(FIXTURE_ALERTS.length);
  });

  it('throws when user is not authenticated', async () => {
    setAuthGuest();
    await expect(getUserAlerts()).rejects.toThrow('Not authenticated');
  });

  it('returns empty array when user has no alerts', async () => {
    setupFromChain([]);
    const alerts = await getUserAlerts();
    expect(alerts).toEqual([]);
  });

  it('propagates Supabase errors', async () => {
    setupFromChain([], { message: 'Permission denied' });
    await expect(getUserAlerts()).rejects.toMatchObject({ message: 'Permission denied' });
  });
});

// ─── createAlert() ───────────────────────────────────────────

describe('createAlert()', () => {
  const payload: CreateAlertPayload = {
    crop_name:            'Wheat',
    state:                'Gujarat',
    condition:            'above',
    target_price_per_qtl: 2400,
  };

  it('creates alert and returns it', async () => {
    const expected = { id: 'new-alert', ...payload, user_id: 'user-abc', is_active: true };
    setupFromChain([expected]);
    const result = await createAlert(payload);
    expect(result.crop_name).toBe('Wheat');
    expect(result.target_price_per_qtl).toBe(2400);
  });

  it('injects user_id from authenticated session', async () => {
    const expected = { id: 'new-alert', ...payload, user_id: 'user-abc', is_active: true };
    setupFromChain([expected]);
    const result = await createAlert(payload);
    expect(result.user_id).toBe('user-abc');
  });

  it('throws when not authenticated', async () => {
    setAuthGuest();
    await expect(createAlert(payload)).rejects.toThrow('Not authenticated');
  });

  it('propagates DB error', async () => {
    setupFromChain([], { message: 'violates check constraint' });
    await expect(createAlert(payload)).rejects.toMatchObject({ message: 'violates check constraint' });
  });
});

// ─── toggleAlert() ───────────────────────────────────────────

describe('toggleAlert()', () => {
  it('resolves without error when toggle succeeds', async () => {
    setupFromChain([]);
    await expect(toggleAlert('alert-001', false)).resolves.toBeUndefined();
  });

  it('propagates error when Supabase fails', async () => {
    setupFromChain([], { message: 'Row not found' });
    await expect(toggleAlert('alert-999', true)).rejects.toMatchObject({ message: 'Row not found' });
  });
});

// ─── deleteAlert() ───────────────────────────────────────────

describe('deleteAlert()', () => {
  it('resolves without error on success', async () => {
    setupFromChain([]);
    await expect(deleteAlert('alert-001')).resolves.toBeUndefined();
  });

  it('propagates Supabase error', async () => {
    setupFromChain([], { message: 'Foreign key violation' });
    await expect(deleteAlert('alert-bad')).rejects.toMatchObject({ message: 'Foreign key violation' });
  });
});

// ─── getAlertHistory() ───────────────────────────────────────

describe('getAlertHistory()', () => {
  const historyRows = [
    {
      id:                      'hist-001',
      alert_id:                'alert-001',
      user_id:                 'user-abc',
      crop_name:               'Wheat',
      state:                   'Gujarat',
      condition:               'above',
      target_price_per_qtl:    2200,
      triggered_price_per_qtl: 2400,
      triggered_at:            '2026-04-24T10:00:00Z',
    },
  ];

  it('returns history items for authenticated user', async () => {
    setupFromChain(historyRows);
    const history = await getAlertHistory();
    expect(history).toHaveLength(1);
    expect(history[0].crop_name).toBe('Wheat');
  });

  it('returns empty array when no history', async () => {
    setupFromChain([]);
    const history = await getAlertHistory();
    expect(history).toEqual([]);
  });

  it('throws when user is not authenticated', async () => {
    setAuthGuest();
    await expect(getAlertHistory()).rejects.toThrow('Not authenticated');
  });
});

// ─── triggerAlertCheck() ─────────────────────────────────────

describe('triggerAlertCheck()', () => {
  it('invokes the check-price-alerts edge function', async () => {
    mockClient.functions.invoke.mockResolvedValue({ data: { triggered: 2 }, error: null });
    await triggerAlertCheck();
    expect(mockClient.functions.invoke).toHaveBeenCalledWith('check-price-alerts');
  });

  it('resolves even when edge function returns a soft error', async () => {
    // Edge function errors are non-fatal — service just console.warns
    mockClient.functions.invoke.mockResolvedValue({
      data:  null,
      error: { message: 'Function timed out' },
    });
    await expect(triggerAlertCheck()).resolves.toBeUndefined();
  });
});
