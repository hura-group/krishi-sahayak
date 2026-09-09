import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mandi,
  MandiCommodity,
  buildDirectionsUrl,
  getMandiCommodities,
  getMandisByDistrict,
  getNearbyMandis,
} from '../src/services/mandiLocatorService';
import {
  getCurrentLocation,
  requestLocationPermission,
} from '../src/services/locationService';
import { Linking } from 'react-native';

interface UserLocation {
  lat:  number;
  lng:  number;
  city: string;
}

interface UseMandiLocatorReturn {
  mandis:           Mandi[];
  selectedMandi:    Mandi | null;
  commodities:      MandiCommodity[];
  userLocation:     UserLocation | null;
  loading:          boolean;
  locationDenied:   boolean;
  commoditiesLoading: boolean;
  error:            string | null;
  radiusKm:         number;
  setRadiusKm:      (r: number) => void;
  selectMandi:      (mandi: Mandi | null) => void;
  openDirections:   (mandi: Mandi) => void;
  refresh:          () => Promise<void>;
}

// Default: Gujarat centre (used when GPS denied)
const GUJARAT_DEFAULT = { lat: 22.2587, lng: 71.1924, city: 'Gujarat' };

export const useMandiLocator = (
  fallbackDistrict?: string,
  fallbackState?:    string
): UseMandiLocatorReturn => {
  const [mandis,             setMandis]             = useState<Mandi[]>([]);
  const [selectedMandi,      setSelectedMandi]      = useState<Mandi | null>(null);
  const [commodities,        setCommodities]        = useState<MandiCommodity[]>([]);
  const [userLocation,       setUserLocation]       = useState<UserLocation | null>(null);
  const [loading,            setLoading]            = useState(true);
  const [locationDenied,     setLocationDenied]     = useState(false);
  const [commoditiesLoading, setCommoditiesLoading] = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [radiusKm,           setRadiusKm]           = useState(100);

  const loadMandis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ── 1. Get GPS ─────────────────────────────────────────
      const granted = await requestLocationPermission();
      let loc: UserLocation | null = null;

      if (granted) {
        const pos = await getCurrentLocation();
        if (pos) {
          loc = { lat: pos.lat, lng: pos.lng, city: pos.city || '' };
          setLocationDenied(false);
        }
      } else {
        setLocationDenied(true);
      }

      // ── 2. Fallback to district / state default ────────────
      if (!loc) {
        loc = GUJARAT_DEFAULT;
        if (fallbackDistrict && fallbackState) {
          const fallbackMandis = await getMandisByDistrict(
            fallbackDistrict, fallbackState
          );
          setMandis(fallbackMandis);
          setLoading(false);
          return;
        }
      }

      setUserLocation(loc);

      // ── 3. Fetch nearby ─────────────────────────────────────
      const nearby = await getNearbyMandis(loc.lat, loc.lng, radiusKm);
      setMandis(nearby);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load mandis');
    } finally {
      setLoading(false);
    }
  }, [radiusKm, fallbackDistrict, fallbackState]);

  useEffect(() => { loadMandis(); }, [loadMandis]);

  // Load commodity prices whenever a mandi is selected
  const selectMandi = useCallback(async (mandi: Mandi | null) => {
    setSelectedMandi(mandi);
    if (!mandi) { setCommodities([]); return; }

    setCommoditiesLoading(true);
    try {
      const data = await getMandiCommodities(mandi.id);
      setCommodities(data);
    } catch {
      setCommodities([]);
    } finally {
      setCommoditiesLoading(false);
    }
  }, []);

  const openDirections = useCallback((mandi: Mandi) => {
    const url = buildDirectionsUrl(
      mandi.lat, mandi.lng, mandi.name,
      userLocation?.lat, userLocation?.lng
    );
    Linking.openURL(url);
  }, [userLocation]);

  return {
    mandis,
    selectedMandi,
    commodities,
    userLocation,
    loading,
    locationDenied,
    commoditiesLoading,
    error,
    radiusKm,
    setRadiusKm,
    selectMandi,
    openDirections,
    refresh: loadMandis,
  };
};
