import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mandi, MandiCommodity } from '../../src/services/mandiLocatorService';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H              = SCREEN_H * 0.52;
const COLLAPSED            = SCREEN_H;

interface MandiBottomSheetProps {
  mandi:              Mandi | null;
  commodities:        MandiCommodity[];
  commoditiesLoading: boolean;
  onClose:            () => void;
  onDirections:       (mandi: Mandi) => void;
}

const formatHours = (h: Mandi['operating_hours']) =>
  `${h.weekdays}  •  Sun: ${h.sunday}`;

const COMMODITY_EMOJI: Record<string, string> = {
  Wheat: '🌾', Rice: '🌾', Cotton: '🌿', Groundnut: '🥜',
  Soybean: '🫘', Maize: '🌽', Onion: '🧅', Potato: '🥔',
  Tomato: '🍅', Sugarcane: '🎋', Bajra: '🌾', Jowar: '🌾',
  Mustard: '🌻', 'Tur Dal': '🫘', Gram: '🫘', Castor: '🌱',
};

export const MandiBottomSheet: React.FC<MandiBottomSheetProps> = ({
  mandi, commodities, commoditiesLoading, onClose, onDirections,
}) => {
  const translateY = useRef(new Animated.Value(COLLAPSED)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue:         mandi ? SCREEN_H - SHEET_H : COLLAPSED,
      useNativeDriver: true,
      tension:         68, friction: 12,
    }).start();
  }, [mandi]);

  if (!mandi) return null;

  const callMandi = () => {
    if (mandi.phone) Linking.openURL(`tel:${mandi.phone}`);
  };

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      {/* Drag handle */}
      <TouchableOpacity onPress={onClose} style={styles.handleArea} activeOpacity={0.7}>
        <View style={styles.handle} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Header ───────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.mandiName} numberOfLines={2}>{mandi.name}</Text>
            <Text style={styles.address} numberOfLines={2}>📍 {mandi.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: mandi.isOpenNow ? '#E8F5E9' : '#FFEBEE' }]}>
            <View style={[styles.statusDot, { backgroundColor: mandi.isOpenNow ? '#2D7A3A' : '#D32F2F' }]} />
            <Text style={[styles.statusText, { color: mandi.isOpenNow ? '#2D7A3A' : '#D32F2F' }]}>
              {mandi.isOpenNow ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* ── Info row ─────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Text style={styles.infoIcon}>📏</Text>
            <Text style={styles.infoLabel}>
              {mandi.distanceKm != null ? `${mandi.distanceKm} km away` : mandi.district}
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoLabel} numberOfLines={1}>
              {mandi.operating_hours.weekdays}
            </Text>
          </View>
          {mandi.phone && (
            <TouchableOpacity style={styles.infoChip} onPress={callMandi}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={[styles.infoLabel, styles.callText]}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Hours detail ─────────────────────────────────── */}
        <View style={styles.hoursBox}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <Text style={styles.hoursText}>Mon–Sat  {mandi.operating_hours.weekdays}</Text>
          <Text style={styles.hoursText}>Sunday    {mandi.operating_hours.sunday}</Text>
        </View>

        {/* ── Top commodities ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Top Commodity Prices</Text>
        {commoditiesLoading ? (
          <ActivityIndicator color="#2D7A3A" style={{ marginVertical: 16 }} />
        ) : commodities.length === 0 ? (
          <Text style={styles.noPrices}>No price data available</Text>
        ) : (
          <View style={styles.commodityList}>
            {commodities.map(c => (
              <View key={c.id} style={styles.commodityRow}>
                <Text style={styles.commEmoji}>{COMMODITY_EMOJI[c.commodity_name] ?? '🌿'}</Text>
                <Text style={styles.commName}>{c.commodity_name}</Text>
                <View style={styles.commPriceCol}>
                  <Text style={styles.commPrice}>
                    ₹{c.avg_price_per_qtl.toLocaleString('en-IN')}
                    <Text style={styles.commUnit}>/qtl</Text>
                  </Text>
                  {c.min_price_per_qtl && c.max_price_per_qtl && (
                    <Text style={styles.commRange}>
                      ₹{c.min_price_per_qtl.toLocaleString('en-IN')} – ₹{c.max_price_per_qtl.toLocaleString('en-IN')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Action buttons ───────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => onDirections(mandi)}
          >
            <Text style={styles.directionsBtnText}>🗺  Get Directions</Text>
          </TouchableOpacity>
          {mandi.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={callMandi}>
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0' },
  content:    { padding: 16, paddingBottom: 32 },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  headerLeft: { flex: 1 },
  mandiName:  { fontSize: 19, fontWeight: '800', color: '#1A1A1A', lineHeight: 24 },
  address:    { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', gap: 4 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Info row
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  infoIcon:  { fontSize: 13 },
  infoLabel: { fontSize: 12, color: '#444', fontWeight: '500' },
  callText:  { color: '#1565C0', fontWeight: '600' },

  // Hours
  hoursBox: { backgroundColor: '#F9FBE7', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#CDDC39' },
  hoursText: { fontSize: 13, color: '#444', lineHeight: 22 },

  // Commodities
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  noPrices:      { color: '#AAAAAA', fontSize: 14, textAlign: 'center', marginVertical: 12 },
  commodityList: { marginBottom: 16 },
  commodityRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  commEmoji:     { fontSize: 22, marginRight: 10 },
  commName:      { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  commPriceCol:  { alignItems: 'flex-end' },
  commPrice:     { fontSize: 16, fontWeight: '800', color: '#2D7A3A' },
  commUnit:      { fontSize: 11, fontWeight: '400', color: '#888' },
  commRange:     { fontSize: 11, color: '#AAAAAA', marginTop: 1 },

  // Actions
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  directionsBtn: {
    flex: 1, backgroundColor: '#2D7A3A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  directionsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  callBtn: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
  },
  callBtnText: { fontSize: 22 },
});
