import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PriceAlert } from '../../src/services/priceAlertService';
import { timeAgo } from '../../src/utils/timeAgo';

interface PriceAlertCardProps {
  alert:    PriceAlert;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const CROP_EMOJI: Record<string, string> = {
  Wheat: '🌾', Rice: '🌾', Cotton: '🌿', Groundnut: '🥜', Soybean: '🫘',
  Maize: '🌽', Onion: '🧅', Potato: '🥔', Tomato: '🍅', Sugarcane: '🎋',
  Bajra: '🌾', Jowar: '🌾', Mustard: '🌻', 'Tur Dal': '🫘',
};

export const PriceAlertCard: React.FC<PriceAlertCardProps> = ({ alert, onToggle, onDelete }) => {
  const shake = useRef(new Animated.Value(0)).current;

  const confirmDelete = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start(() => onDelete(alert.id));
  };

  const emoji     = CROP_EMOJI[alert.crop_name] ?? '🌿';
  const symbol    = alert.condition === 'above' ? '>' : '<';
  const condColor = alert.condition === 'above' ? '#2D7A3A' : '#D32F2F';
  const condBg    = alert.condition === 'above' ? '#E8F5E9' : '#FFEBEE';

  return (
    <Animated.View style={[styles.card, !alert.is_active && styles.cardInactive, { transform: [{ translateX: shake }] }]}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: alert.is_active ? condColor : '#BDBDBD' }]} />

      <View style={styles.body}>
        {/* Row 1: crop name + condition badge + toggle */}
        <View style={styles.row}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.titleGroup}>
            <Text style={[styles.cropName, !alert.is_active && styles.textMuted]}>
              {alert.crop_name}
            </Text>
            <Text style={styles.state}>{alert.state}</Text>
          </View>
          <Switch
            value={alert.is_active}
            onValueChange={v => onToggle(alert.id, v)}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor={alert.is_active ? '#2D7A3A' : '#9E9E9E'}
            style={styles.toggle}
          />
        </View>

        {/* Row 2: condition summary */}
        <View style={[styles.conditionPill, { backgroundColor: condBg }]}>
          <Text style={[styles.conditionText, { color: condColor }]}>
            Notify when {alert.crop_name} {symbol} ₹{alert.target_price_per_qtl.toLocaleString('en-IN')}/qtl
          </Text>
        </View>

        {/* Row 3: last triggered + delete */}
        <View style={styles.footer}>
          <Text style={styles.lastTriggered}>
            {alert.last_triggered_at
              ? `⏱ Last fired ${timeAgo(alert.last_triggered_at)}`
              : '⏳ Never triggered yet'}
          </Text>
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deleteBtn}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: '#FFFFFF',
    borderRadius:    14,
    marginHorizontal: 16,
    marginVertical:  6,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       3,
    overflow:        'hidden',
  },
  cardInactive: { opacity: 0.55 },
  accent:  { width: 4 },
  body:    { flex: 1, padding: 14 },
  row:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emoji:   { fontSize: 28, marginRight: 10 },
  titleGroup: { flex: 1 },
  cropName:   { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  textMuted:  { color: '#9E9E9E' },
  state:      { fontSize: 12, color: '#888', marginTop: 1 },
  toggle:     { marginLeft: 8 },
  conditionPill: {
    borderRadius:   8,
    paddingHorizontal: 10,
    paddingVertical:   6,
    marginBottom:   10,
    alignSelf:      'flex-start',
  },
  conditionText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastTriggered: { fontSize: 12, color: '#888' },
  deleteBtn:     { fontSize: 18 },
});
