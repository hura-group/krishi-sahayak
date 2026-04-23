import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MarketPrice } from '../../hooks/useMarketFilter';

interface MarketPriceCardProps {
  item: MarketPrice;
}

const getTrend = (price: number, msp?: number) => {
  if (!msp) return null;
  if (price < msp) return { label: '⚠ Below MSP', color: '#FF4444', bg: '#FFF0F0' };
  if (price > msp * 1.1) return { label: '▲ Above MSP', color: '#2D7A3A', bg: '#E8F5E9' };
  return { label: '─ Near MSP', color: '#888', bg: '#F5F5F5' };
};

export const MarketPriceCard: React.FC<MarketPriceCardProps> = ({ item }) => {
  const trend = getTrend(item.price_per_kg, item.msp_price_per_kg);
  const date = new Date(item.price_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.crop}>{item.crop_name}</Text>
        <Text style={styles.state}>{item.state} · {date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>₹{item.price_per_kg.toFixed(0)}<Text style={styles.unit}>/kg</Text></Text>
        {trend && (
          <View style={[styles.badge, { backgroundColor: trend.bg }]}>
            <Text style={[styles.badgeText, { color: trend.color }]}>{trend.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  left: { flex: 1 },
  crop: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  state: { fontSize: 12, color: '#888', marginTop: 3 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: '#2D7A3A' },
  unit: { fontSize: 12, fontWeight: '400', color: '#888' },
  badge: { marginTop: 4, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
