import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { MarketPrice } from '../../hooks/useMarketFilter';
import { MarketPriceCard } from './MarketPriceCard';

interface MarketPriceListProps {
  prices: MarketPrice[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  headerComponent?: React.ReactElement;
}

export const MarketPriceList: React.FC<MarketPriceListProps> = ({
  prices,
  loading,
  error,
  onRefresh,
  refreshing,
  headerComponent,
}) => {
  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D7A3A" />
        <Text style={styles.loadingText}>Loading prices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={prices}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <MarketPriceCard item={item} />}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyTitle}>No prices found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
        </View>
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={prices.length === 0 ? styles.emptyContainer : { paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  errorIcon: { fontSize: 36, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#FF4444', textAlign: 'center' },
  emptyContainer: { flexGrow: 1 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
});
