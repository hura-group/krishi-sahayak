import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Mandi } from '../../src/services/mandiLocatorService';

interface MandiMarkerProps {
  mandi:    Mandi;
  selected: boolean;
  onPress:  (mandi: Mandi) => void;
}

export const MandiMarker: React.FC<MandiMarkerProps> = memo(({ mandi, selected, onPress }) => {
  const isOpen   = mandi.isOpenNow;
  const bgColor  = selected ? '#1B5E20' : isOpen ? '#2D7A3A' : '#9E9E9E';
  const size     = selected ? 48 : 40;

  return (
    <Marker
      coordinate={{ latitude: mandi.lat, longitude: mandi.lng }}
      onPress={() => onPress(mandi)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        {/* Bubble */}
        <View style={[styles.bubble, { backgroundColor: bgColor, width: size, height: size }]}>
          <Text style={[styles.icon, { fontSize: selected ? 22 : 18 }]}>🏪</Text>
        </View>
        {/* Pin tail */}
        <View style={[styles.tail, { borderTopColor: bgColor }]} />

        {/* Open badge */}
        {isOpen && !selected && (
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>OPEN</Text>
          </View>
        )}

        {/* Distance */}
        {mandi.distanceKm != null && selected && (
          <View style={styles.distancePill}>
            <Text style={styles.distancePillText}>{mandi.distanceKm} km</Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  wrapper:  { alignItems: 'center' },
  bubble: {
    borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
    borderWidth: 2, borderColor: '#fff',
  },
  icon: { textAlign: 'center' },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  openBadge: {
    position: 'absolute', top: -6, right: -18,
    backgroundColor: '#43A047', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  openBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  distancePill: {
    marginTop: 3, backgroundColor: '#1B5E20',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  distancePillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
