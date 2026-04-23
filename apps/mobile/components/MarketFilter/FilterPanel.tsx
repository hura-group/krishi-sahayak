import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMarketFilterContext, SortOption } from '../../src/context/MarketFilterContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const COMMON_CROPS = [
  'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar', 'Cotton', 'Groundnut',
  'Soybean', 'Sugarcane', 'Onion', 'Potato', 'Tomato', 'Mustard', 'Tur Dal',
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: '📅 Latest first', value: 'date_desc' },
  { label: '💰 Price: Low → High', value: 'price_asc' },
  { label: '💰 Price: High → Low', value: 'price_desc' },
  { label: '🔤 A → Z', value: 'name_asc' },
];

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ visible, onClose }) => {
  const { filter, updateState, toggleCrop, setSort } = useMarketFilterContext();
  const [tab, setTab] = useState<'state' | 'crops' | 'sort'>('state');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Prices</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['state', 'crops', 'sort'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'state' ? '📍 State' : t === 'crops' ? '🌾 Crops' : '⇅ Sort'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {tab === 'state' &&
              INDIAN_STATES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.row, filter.state === s && styles.rowSelected]}
                  onPress={() => updateState(s)}
                >
                  <Text style={[styles.rowText, filter.state === s && styles.rowTextSelected]}>
                    {s}
                  </Text>
                  {filter.state === s && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}

            {tab === 'crops' &&
              COMMON_CROPS.map(c => {
                const selected = filter.crops.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => toggleCrop(c)}
                  >
                    <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{c}</Text>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })}

            {tab === 'sort' &&
              SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.row, filter.sort === opt.value && styles.rowSelected]}
                  onPress={() => setSort(opt.value)}
                >
                  <Text style={[styles.rowText, filter.sort === opt.value && styles.rowTextSelected]}>
                    {opt.label}
                  </Text>
                  {filter.sort === opt.value && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  doneBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#2D7A3A', borderRadius: 8 },
  doneText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2D7A3A' },
  tabText: { fontSize: 13, color: '#888' },
  tabTextActive: { color: '#2D7A3A', fontWeight: '600' },
  body: { padding: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginVertical: 2 },
  rowSelected: { backgroundColor: '#E8F5E9' },
  rowText: { fontSize: 15, color: '#333' },
  rowTextSelected: { color: '#2D7A3A', fontWeight: '600' },
  check: { fontSize: 16, color: '#2D7A3A' },
});
