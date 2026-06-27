import { supabase } from '../lib/supabase';

export interface ActiveCrop {
  crop_id: string;
  crop_name: string;
  farm_id: string;
  farm_name: string | null;
  sowing_date: string | null;
  expected_harvest: string | null;
}

// Get every crop currently growing (status = 'growing') across all of a
// user's farms. Powers the Market Filter's "default to my active crops".
export const getActiveCropsByUserId = async (userId: string): Promise<ActiveCrop[]> => {
  const { data, error } = await supabase
    .rpc('get_active_crops_by_user_id', { p_user_id: userId });
  if (error) throw error;
  return data ?? [];
};

// Distinct crop names only — the common case for filter defaulting,
// where farm/date detail isn't needed.
export const getActiveCropNamesByUserId = async (userId: string): Promise<string[]> => {
  const crops = await getActiveCropsByUserId(userId);
  return Array.from(new Set(crops.map((c) => c.crop_name)));
};
