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
}

const defaultFilter: MarketFilter = {
  state: 'Gujarat',
  crops: [],
  sort: 'date_desc',
  dateRange: 7,
};

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
};

const MarketFilterContext = createContext<MarketFilterContextType>({
  filter: defaultFilter,
  setFilter: () => {},
  updateState: () => {},
  toggleCrop: () => {},
  setSort: () => {},
  resetFilter: () => {},
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

  return (
    <MarketFilterContext.Provider
      value={{ filter, setFilter, updateState, toggleCrop, setSort, resetFilter }}
    >
      {children}
    </MarketFilterContext.Provider>
  );
};

export const useMarketFilterContext = () => useContext(MarketFilterContext);
