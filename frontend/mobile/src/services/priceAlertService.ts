import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id:                   string;
  user_id:              string;
  crop_name:            string;
  state:                string;
  condition:            AlertCondition;
  target_price_per_qtl: number;
  is_active:            boolean;
  last_triggered_at:    string | null;
  created_at:           string;
}

export interface AlertHistoryItem {
  id:                      string;
  alert_id:                string;
  user_id:                 string;
  crop_name:               string;
  state:                   string;
  condition:               AlertCondition;
  target_price_per_qtl:    number;
  triggered_price_per_qtl: number;
  triggered_at:            string;
}

export interface CreateAlertPayload {
  crop_name:            string;
  state:                string;
  condition:            AlertCondition;
  target_price_per_qtl: number;
}

// ─── Service Functions ────────────────────────────────────────

/** Fetch all alerts for the current user (active + inactive) */
export const getUserAlerts = async (): Promise<PriceAlert[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

/** Create a new price alert */
export const createAlert = async (payload: CreateAlertPayload): Promise<PriceAlert> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Toggle is_active on an alert */
export const toggleAlert = async (alertId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from('price_alerts')
    .update({ is_active: isActive })
    .eq('id', alertId);

  if (error) throw error;
};

/** Permanently delete an alert (cascades to history) */
export const deleteAlert = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
};

/** Fetch last 30 alert history items for current user */
export const getAlertHistory = async (): Promise<AlertHistoryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('alert_history')
    .select('*')
    .eq('user_id', user.id)
    .order('triggered_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
};

/** Manually invoke the edge function to check alerts right now */
export const triggerAlertCheck = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke('check-price-alerts');
  if (error) console.warn('[AlertCheck]', error.message);
};
