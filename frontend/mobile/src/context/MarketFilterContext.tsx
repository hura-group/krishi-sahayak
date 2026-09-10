import React, { createContext, useContext, useEffect, useState } from 'react';

export type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'date_desc';

export interface MarketFilter {
  state: string;
  crops: string[];
  sort: SortOption;
  dateRange: number; // days back
}

interface MarketFilterContextType {
  filter: MarketFilter;
  setFilter: (filter: MarketFilter) => void;
  updateState: (state: string) => void;
  toggleCrop: (crop: string) => void;
  setSort: (sort: SortOption) => void;
  resetFilter: () => void;
  applyProfileDefaults: (state: string | null, crops: string[]) => void;
}

const defaultFilter: MarketFilter = {
  state: 'Gujarat',
  crops: [],
  sort: 'date_desc',
  dateRange: 7,
};

const PROFILE_DEFAULTS_KEY = 'market_filter_profile_applied';

const marketFilterStorage = {
  get: (): MarketFilter | undefined => {
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      const raw = storage.getString('market_filter');
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },
  set: (value: MarketFilter) => {
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      storage.set('market_filter', JSON.stringify(value));
    } catch {
      // ignore
    }
  },
  // Tracks whether we've already seeded the filter from the user's profile once.
  // Prevents re-applying defaults and clobbering a filter the user has since changed.
  hasAppliedProfileDefaults: (): boolean => {
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      return storage.getBoolean(PROFILE_DEFAULTS_KEY) ?? false;
    } catch {
      return false;
    }
  },
  markProfileDefaultsApplied: () => {
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV();
      storage.set(PROFILE_DEFAULTS_KEY, true);
    } catch {
      // ignore
    }
  },
};

const MarketFilterContext = createContext<MarketFilterContextType>({
  filter: defaultFilter,
  setFilter: () => {},
  updateState: () => {},
  toggleCrop: () => {},
  setSort: () => {},
  resetFilter: () => {},
  applyProfileDefaults: () => {},
});

export const MarketFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filter, setFilterState] = useState<MarketFilter>(() => {
    return marketFilterStorage.get() ?? defaultFilter;
  });

  useEffect(() => {
    marketFilterStorage.set(filter);
  }, [filter]);

  const setFilter = (newFilter: MarketFilter) => setFilterState(newFilter);

  const updateState = (state: string) =>
    setFilterState(prev => ({ ...prev, state }));

  const toggleCrop = (crop: string) =>
    setFilterState(prev => ({
      ...prev,
      crops: prev.crops.includes(crop)
        ? prev.crops.filter(c => c !== crop)
        : [...prev.crops, crop],
    }));

  const setSort = (sort: SortOption) =>
    setFilterState(prev => ({ ...prev, sort }));

  const resetFilter = () => setFilterState(defaultFilter);

  // Seeds the filter from the user's profile (home state) + their actively
  // tracked crops (from price_alerts), but only the FIRST time it's ever
  // called for this device — never overrides a filter the user later changes.
  const applyProfileDefaults = (state: string | null, crops: string[]) => {
    if (marketFilterStorage.hasAppliedProfileDefaults()) return;
    marketFilterStorage.markProfileDefaultsApplied();
    setFilterState(prev => ({
      ...prev,
      state: state ?? prev.state,
      crops: crops.length > 0 ? crops : prev.crops,
    }));
  };

  return (
    <MarketFilterContext.Provider
      value={{ filter, setFilter, updateState, toggleCrop, setSort, resetFilter, applyProfileDefaults }}
    >
      {children}
    </MarketFilterContext.Provider>
  );
};

export const useMarketFilterContext = () => useContext(MarketFilterContext);
