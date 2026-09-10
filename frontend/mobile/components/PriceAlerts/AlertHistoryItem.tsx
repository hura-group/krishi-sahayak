import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertHistoryItem as HistoryItem } from '../../src/services/priceAlertService';
import { timeAgo, formatAlertDate } from '../../src/utils/timeAgo';

interface AlertHistoryItemProps {
  item: HistoryItem;
}

const CROP_EMOJI: Record<string, string> = {
  Wheat: '🌾', Rice: '🌾', Cotton: '🌿', Groundnut: '🥜', Soybean: '🫘',
  Maize: '🌽', Onion: '🧅', Potato: '🥔', Tomato: '🍅', Sugarcane: '🎋',
  Bajra: '🌾', Jowar: '🌾', Mustard: '🌻', 'Tur Dal': '🫘',
};

export const AlertHistoryItemRow: React.FC<AlertHistoryItemProps> = ({ item }) => {
  const isAbove   = item.condition === 'above';
  const color     = isAbove ? '#2D7A3A' : '#D32F2F';
  const bg        = isAbove ? '#E8F5E9' : '#FFEBEE';
  const arrow     = isAbove ? '▲' : '▼';
  const verb      = isAbove ? 'crossed above' : 'dropped below';
  const emoji     = CROP_EMOJI[item.crop_name] ?? '🌿';

  const priceDiff    = Math.abs(item.triggered_price_per_qtl - item.target_price_per_qtl);
  const diffPercent  = ((priceDiff / item.target_price_per_qtl) * 100).toFixed(1);

  return (
    <View style={styles.row}>
      {/* Left: icon badge */}
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeEmoji}>{emoji}</Text>
        <Text style={[styles.arrow, { color }]}>{arrow}</Text>
      </View>

      {/* Middle: text */}
      <View style={styles.content}>
        <Text style={styles.headline} numberOfLines={1}>
          <Text style={styles.cropBold}>{item.crop_name}</Text>
          {' '}{verb}{' '}
          <Text style={[styles.targetPrice, { color }]}>
            ₹{item.target_price_per_qtl.toLocaleString('en-IN')}/qtl
          </Text>
        </Text>
        <Text style={styles.sub}>
          Reached ₹{item.triggered_price_per_qtl.toLocaleString('en-IN')} · {item.state}
          {'  '}
          <Text style={[styles.diff, { color }]}>
            {arrow} {diffPercent}% off target
          </Text>
        </Text>
      </View>

      {/* Right: time */}
      <View style={styles.timeCol}>
        <Text style={styles.timeAgo}>{timeAgo(item.triggered_at)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  badge: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  badgeEmoji: { fontSize: 18 },
  arrow:      { fontSize: 10, fontWeight: '800', marginTop: -2 },
  content:    { flex: 1, marginRight: 8 },
  headline:   { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  cropBold:   { fontWeight: '700' },
  targetPrice: { fontWeight: '700' },
  sub:        { fontSize: 12, color: '#888', marginTop: 2 },
  diff:       { fontWeight: '600' },
  timeCol:    { alignItems: 'flex-end', minWidth: 56 },
  timeAgo:    { fontSize: 11, color: '#AAAAAA', textAlign: 'right' },
});
