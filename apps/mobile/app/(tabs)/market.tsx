import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MarketFilterProvider } from '../../src/context/MarketFilterContext';
import { useMarketFilter } from '../../hooks/useMarketFilter';
import { FilterChips, FilterPanel, MarketPriceList } from '../../components/MarketFilter';

const MarketPricesContent: React.FC = () => {
  const { prices, loading, error, refresh } = useMarketFilter();
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const header = (
    <View>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Mandi Prices</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
          <Text style={styles.filterBtnText}>⇅ Filter</Text>
        </TouchableOpacity>
      </View>
      <FilterChips />
      {prices.length > 0 && (
        <Text style={styles.count}>{prices.length} result{prices.length !== 1 ? 's' : ''}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MarketPriceList
        prices={prices}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        headerComponent={header}
      />
      <FilterPanel visible={filterOpen} onClose={() => setFilterOpen(false)} />
    </SafeAreaView>
  );
};

export default function MarketPricesScreen() {
  return (
    <MarketFilterProvider>
      <MarketPricesContent />
    </MarketFilterProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  filterBtn: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2D7A3A',
  },
  filterBtnText: { color: '#2D7A3A', fontWeight: '600', fontSize: 14 },
  count: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, fontSize: 12, color: '#888' },
});
