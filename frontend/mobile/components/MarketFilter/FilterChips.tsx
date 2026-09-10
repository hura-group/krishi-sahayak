import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMarketFilterContext } from '../../src/context/MarketFilterContext';

export const FilterChips: React.FC = () => {
  const { filter, updateState, toggleCrop, resetFilter } = useMarketFilterContext();
  const hasActive = filter.crops.length > 0 || filter.state !== 'Gujarat';

  if (!hasActive) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.content}>
      {filter.state !== 'Gujarat' && (
        <TouchableOpacity style={styles.chip} onPress={() => updateState('Gujarat')}>
          <Text style={styles.chipText}>📍 {filter.state} ✕</Text>
        </TouchableOpacity>
      )}
      {filter.crops.map(crop => (
        <TouchableOpacity key={crop} style={styles.chip} onPress={() => toggleCrop(crop)}>
          <Text style={styles.chipText}>🌾 {crop} ✕</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.chip, styles.clearChip]} onPress={resetFilter}>
        <Text style={[styles.chipText, styles.clearText]}>Clear all</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { maxHeight: 44 },
  content: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2D7A3A',
  },
  chipText: { fontSize: 13, color: '#2D7A3A', fontWeight: '500' },
  clearChip: { backgroundColor: '#FFF3E0', borderColor: '#FFA500' },
  clearText: { color: '#FFA500' },
});
