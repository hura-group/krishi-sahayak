import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RADII = [25, 50, 100, 150, 200];

interface RadiusSelectorProps {
  value:    number;
  onChange: (km: number) => void;
  count:    number;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({ value, onChange, count }) => (
  <View style={styles.wrapper}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Text style={styles.label}>Radius:</Text>
      {RADII.map(r => (
        <TouchableOpacity
          key={r}
          style={[styles.pill, value === r && styles.pillActive]}
          onPress={() => onChange(r)}
        >
          <Text style={[styles.pillText, value === r && styles.pillTextActive]}>
            {r} km
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.count}>{count} mandi{count !== 1 ? 's' : ''}</Text>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
    paddingVertical: 8,
  },
  row:          { paddingHorizontal: 16, alignItems: 'center', gap: 6 },
  label:        { fontSize: 13, color: '#888', fontWeight: '500', marginRight: 4 },
  pill:         { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  pillActive:   { backgroundColor: '#2D7A3A', borderColor: '#2D7A3A' },
  pillText:     { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextActive:{ color: '#fff', fontWeight: '700' },
  count:        { fontSize: 12, color: '#2D7A3A', fontWeight: '600', marginLeft: 8 },
});
