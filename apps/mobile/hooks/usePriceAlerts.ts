import { useCallback, useEffect, useState } from 'react';
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
    } finally {
      setCreating(false);
    }
  }, []);

  const toggle = useCallback(async (id: string, isActive: boolean) => {
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: isActive } : a));
    try {
      await toggleAlert(id, isActive);
    } catch {
      // Roll back
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !isActive } : a));
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    // Optimistic
    setAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await deleteAlert(id);
      // Also purge from history display
      setHistory(prev => prev.filter(h => h.alert_id !== id));
    } catch {
      await loadAlerts();
    }
  }, [loadAlerts]);

  return { alerts, history, loading, historyLoading, error, creating, refresh, create, toggle, remove };
};
