import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMarketFilterContext, SortOption } from '../../src/context/MarketFilterContext';
import { INDIAN_STATES, STATES_BY_REGION, STATE_REGION_ORDER } from '../../src/data/indianStates';
import {
  COMMODITIES_BY_CATEGORY,
  COMMODITY_CATEGORY_ORDER,
  getCommodityIcon,
} from '../../src/data/commodities';

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
  const { filter, updateState, toggleCrop, setSort, resetFilter } = useMarketFilterContext();
  const [tab, setTab] = useState<'state' | 'crops' | 'sort'>('state');
  const [stateQuery, setStateQuery] = useState('');
  const [cropQuery, setCropQuery] = useState('');

  // ── Filtered states, grouped by region ──────────────────────────────────
  const visibleStateGroups = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    return STATE_REGION_ORDER.map(region => ({
      region,
      states: (STATES_BY_REGION[region] ?? []).filter(s => !q || s.toLowerCase().includes(q)),
    })).filter(g => g.states.length > 0);
  }, [stateQuery]);

  // ── Filtered commodities, grouped by category ───────────────────────────
  const visibleCropGroups = useMemo(() => {
    const q = cropQuery.trim().toLowerCase();
    return COMMODITY_CATEGORY_ORDER.map(category => ({
      category,
      items: (COMMODITIES_BY_CATEGORY[category] ?? []).filter(
        c => !q || c.name.toLowerCase().includes(q),
      ),
    })).filter(g => g.items.length > 0);
  }, [cropQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filter Prices</Text>
              <Text style={styles.subtitle}>
                {filter.state}
                {filter.crops.length > 0 ? `  ·  ${filter.crops.length} crop${filter.crops.length > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={resetFilter} style={styles.resetBtn}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
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
                  {t === 'crops' && filter.crops.length > 0 ? ` (${filter.crops.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search (state / crops tabs only) */}
          {tab === 'state' && (
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${INDIAN_STATES.length} states...`}
                placeholderTextColor="#A0A0A0"
                value={stateQuery}
                onChangeText={setStateQuery}
                autoCapitalize="none"
              />
            </View>
          )}
          {tab === 'crops' && (
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search commodity..."
                placeholderTextColor="#A0A0A0"
                value={cropQuery}
                onChangeText={setCropQuery}
                autoCapitalize="none"
              />
              {filter.crops.length > 0 && (
                <TouchableOpacity onPress={() => filter.crops.forEach(toggleCrop)}>
                  <Text style={styles.clearAllText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {tab === 'state' &&
              visibleStateGroups.map(group => (
                <View key={group.region}>
                  <Text style={styles.groupHeader}>{group.region}</Text>
                  {group.states.map(s => (
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
                </View>
              ))}

            {tab === 'crops' &&
              visibleCropGroups.map(group => (
                <View key={group.category}>
                  <Text style={styles.groupHeader}>{group.category}</Text>
                  {group.items.map(c => {
                    const selected = filter.crops.includes(c.name);
                    return (
                      <TouchableOpacity
                        key={c.name}
                        style={[styles.row, selected && styles.rowSelected]}
                        onPress={() => toggleCrop(c.name)}
                      >
                        <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                          {c.icon}  {c.name}
                        </Text>
                        {selected && <Text style={styles.check}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

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

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E53935' },
  resetText: { color: '#E53935', fontWeight: '600', fontSize: 13 },
  doneBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#2D7A3A', borderRadius: 8 },
  doneText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2D7A3A' },
  tabText: { fontSize: 13, color: '#888' },
  tabTextActive: { color: '#2D7A3A', fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 10, marginBottom: 4, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  clearAllText: { fontSize: 13, color: '#E53935', fontWeight: '600', paddingHorizontal: 4 },
  body: { padding: 8 },
  groupHeader: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginVertical: 2 },
  rowSelected: { backgroundColor: '#E8F5E9' },
  rowText: { fontSize: 15, color: '#333' },
  rowTextSelected: { color: '#2D7A3A', fontWeight: '600' },
  check: { fontSize: 16, color: '#2D7A3A' },
});
