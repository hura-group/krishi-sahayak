import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mandi } from '../../src/services/mandiLocatorService';

interface MandiListItemProps {
  mandi:    Mandi;
  selected: boolean;
  onPress:  (mandi: Mandi) => void;
}

export const MandiListItem: React.FC<MandiListItemProps> = ({ mandi, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.card, selected && styles.cardSelected]}
    onPress={() => onPress(mandi)}
    activeOpacity={0.8}
  >
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: mandi.isOpenNow ? '#E8F5E9' : '#F5F5F5' }]}>
        <Text style={styles.icon}>🏪</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{mandi.name}</Text>
        <Text style={styles.district}>{mandi.district}, {mandi.state}</Text>
      </View>
      <View style={styles.right}>
        {mandi.distanceKm != null && (
          <Text style={styles.distance}>{mandi.distanceKm} km</Text>
        )}
        <View style={[styles.dot, { backgroundColor: mandi.isOpenNow ? '#2D7A3A' : '#D32F2F' }]} />
      </View>
    </View>
    <Text style={styles.hours} numberOfLines={1}>
      🕐 {mandi.operating_hours.weekdays}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 12, marginHorizontal: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected:  { borderColor: '#2D7A3A', backgroundColor: '#F1F8F1' },
  row:           { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconBox:       { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  icon:          { fontSize: 20 },
  info:          { flex: 1 },
  name:          { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  district:      { fontSize: 12, color: '#888', marginTop: 2 },
  right:         { alignItems: 'flex-end', gap: 4 },
  distance:      { fontSize: 12, fontWeight: '700', color: '#2D7A3A' },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  hours:         { fontSize: 11, color: '#AAAAAA' },
});
