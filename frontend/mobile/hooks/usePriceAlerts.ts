import { useCallback, useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { ANALYTICS_EVENTS } from '../src/analytics/events';
import {
  AlertHistoryItem,
  CreateAlertPayload,
  PriceAlert,
  createAlert,
  deleteAlert,
  getAlertHistory,
  getUserAlerts,
  toggleAlert,
} from '../src/services/priceAlertService';

interface UsePriceAlertsReturn {
  alerts:          PriceAlert[];
  history:         AlertHistoryItem[];
  loading:         boolean;
  historyLoading:  boolean;
  error:           string | null;
  creating:        boolean;
  refresh:         () => Promise<void>;
  create:          (payload: CreateAlertPayload) => Promise<void>;
  toggle:          (id: string, isActive: boolean) => Promise<void>;
  remove:          (id: string) => Promise<void>;
}

export const usePriceAlerts = (): UsePriceAlertsReturn => {
  const posthog = usePostHog();
  const [alerts,         setAlerts]         = useState<PriceAlert[]>([]);
  const [history,        setHistory]        = useState<AlertHistoryItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [creating,       setCreating]       = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserAlerts();
      setAlerts(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAlertHistory();
      setHistory(data);
    } catch {
      // history is non-critical — fail silently
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadAlerts(), loadHistory()]);
  }, [loadAlerts, loadHistory]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (payload: CreateAlertPayload) => {
    setCreating(true);
    try {
      const newAlert = await createAlert(payload);
      setAlerts(prev => [newAlert, ...prev]);
      posthog.capture(ANALYTICS_EVENTS.PRICE_ALERT_CREATED, {
        alert_id: newAlert.id,
        crop_name: newAlert.crop_name,
        condition: newAlert.condition,
      });
    } catch (error) {
      posthog.captureException(new Error('Price alert creation failed'), {
        operation: 'price_alert_create',
      });
      throw error;
    } finally {
      setCreating(false);
    }
  }, [posthog]);

  const toggle = useCallback(async (id: string, isActive: boolean) => {
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: isActive } : a));
    try {
      await toggleAlert(id, isActive);
      posthog.capture(ANALYTICS_EVENTS.PRICE_ALERT_STATUS_CHANGED, {
        alert_id: id,
        is_active: isActive,
      });
    } catch {
      // Roll back
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !isActive } : a));
      posthog.captureException(new Error('Price alert status change failed'), {
        operation: 'price_alert_status_change',
      });
    }
  }, [posthog]);

  const remove = useCallback(async (id: string) => {
    // Optimistic
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await deleteAlert(id);
      // Also purge from history display
      setHistory(prev => prev.filter(h => h.alert_id !== id));
      posthog.capture(ANALYTICS_EVENTS.PRICE_ALERT_DELETED, { alert_id: id });
    } catch {
      await loadAlerts();
      posthog.captureException(new Error('Price alert deletion failed'), {
        operation: 'price_alert_delete',
      });
    }
  }, [loadAlerts, posthog]);

  return { alerts, history, loading, historyLoading, error, creating, refresh, create, toggle, remove };
};
