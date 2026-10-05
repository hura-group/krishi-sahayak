import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { tokens } from '@/theme/tokens';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { track } from '@/utils/analytics';

const MANDI_DATA = [
  { id: '1', commodity: 'Wheat (गेहूं)', mandi: 'Ahmedabad APMC', price: '₹2,450', unit: '/qtl', trend: 'up', change: '+₹50', date: 'Today' },
  { id: '2', commodity: 'Soybean (सोयाबीन)', mandi: 'Rajkot APMC', price: '₹4,820', unit: '/qtl', trend: 'down', change: '-₹30', date: 'Today' },
  { id: '3', commodity: 'Cotton (कपास)', mandi: 'Surat APMC', price: '₹7,100', unit: '/qtl', trend: 'up', change: '+₹120', date: 'Yesterday' },
  { id: '4', commodity: 'Groundnut (मूंगफली)', mandi: 'Junagadh APMC', price: '₹6,300', unit: '/qtl', trend: 'stable', change: '0', date: 'Today' },
];

const CATEGORIES = ['All Crops', 'Cereals', 'Oilseeds', 'Pulses', 'Vegetables'];

export default function MarketScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Crops');

  useEffect(() => {
    track('market_price_viewed', { source: 'bottom_nav' });
  }, []);

  const filteredData = MANDI_DATA.filter((item) =>
    item.commodity.toLowerCase().includes(search.toLowerCase()) ||
    item.mandi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mandi Market Rates</Text>
        <Input
          placeholder="Search crop or mandi..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchBar}
        />
      </View>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.chip, selectedCategory === cat && styles.activeChip]}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.activeChipText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mandi Price Cards List */}
      <View style={styles.list}>
        {filteredData.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.commodity}>{item.commodity}</Text>
                <Text style={styles.mandi}>{item.mandi}</Text>
              </View>
              <Badge
                label={item.change}
                variant={item.trend === 'up' ? 'success' : item.trend === 'down' ? 'error' : 'info'}
              />
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{item.price}</Text>
                <Text style={styles.unit}>{item.unit}</Text>
              </View>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
    paddingTop: 50,
  },
  header: {
    gap: tokens.spacing.xs,
  },
  title: {
    ...tokens.typography.header,
    color: tokens.colors.primary,
  },
  searchBar: {
    marginBottom: 0,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.cardBackground,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginRight: tokens.spacing.xs,
  },
  activeChip: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  chipText: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
  activeChipText: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
  list: {
    gap: tokens.spacing.sm,
  },
  card: {
    gap: tokens.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  commodity: {
    ...tokens.typography.title,
    color: tokens.colors.textPrimary,
  },
  mandi: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  unit: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
    marginLeft: 2,
  },
  date: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
});