import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useMandiLocator }  from '../../hooks/useMandiLocator';
import { useAuth }          from '../../src/context/AuthContext';
import {
  MandiBottomSheet,
  MandiListItem,
  MandiMarker,
  RadiusSelector,
} from '../../components/MandiLocator';
import { Mandi } from '../../src/services/mandiLocatorService';

type ViewMode = 'map' | 'list';

export default function MandiMapScreen() {
  const { user }       = useAuth();
  const mapRef         = useRef<MapView>(null);
  const [mode, setMode] = useState<ViewMode>('map');
  const [refreshing, setRefreshing] = useState(false);

  const {
    mandis, selectedMandi, commodities, userLocation,
    loading, locationDenied, commoditiesLoading, error,
    radiusKm, setRadiusKm, selectMandi, openDirections, refresh,
  } = useMandiLocator(
    user?.user_metadata?.district,
    user?.user_metadata?.state
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleMarkerPress = (mandi: Mandi) => {
    selectMandi(mandi);
    // Animate map to centre on tapped mandi
    mapRef.current?.animateToRegion({
      latitude:        mandi.lat - 0.012, // shift up to leave room for sheet
      longitude:       mandi.lng,
      latitudeDelta:   0.08,
      longitudeDelta:  0.08,
    }, 400);
  };

  const handleMapPress = () => {
    if (selectedMandi) selectMandi(null);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centred}>
        <ActivityIndicator size="large" color="#2D7A3A" />
        <Text style={styles.loadingText}>Finding nearby mandis…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.centred}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initialRegion = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.9, longitudeDelta: 0.9 }
    : { latitude: 22.2587, longitude: 71.1924, latitudeDelta: 4, longitudeDelta: 4 };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Mandi Locator</Text>
          {locationDenied
            ? <Text style={styles.subheading}>📍 Enable location for better results</Text>
            : userLocation?.city
            ? <Text style={styles.subheading}>📍 Near {userLocation.city}</Text>
            : null}
        </View>
        {/* Map / List toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'map' && styles.toggleBtnActive]}
            onPress={() => setMode('map')}
          >
            <Text style={[styles.toggleText, mode === 'map' && styles.toggleTextActive]}>🗺 Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'list' && styles.toggleBtnActive]}
            onPress={() => setMode('list')}
          >
            <Text style={[styles.toggleText, mode === 'list' && styles.toggleTextActive]}>☰ List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Radius selector ─────────────────────────────────── */}
      <RadiusSelector value={radiusKm} onChange={setRadiusKm} count={mandis.length} />

      {/* ── MAP VIEW ────────────────────────────────────────── */}
      {mode === 'map' && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
            showsCompass={false}
            mapPadding={{ bottom: selectedMandi ? 320 : 0, top: 0, left: 0, right: 0 }}
          >
            {/* Radius circle */}
            {userLocation && (
              <Circle
                center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
                radius={radiusKm * 1000}
                strokeColor="rgba(45,122,58,0.3)"
                fillColor="rgba(45,122,58,0.05)"
                strokeWidth={1.5}
              />
            )}

            {/* Mandi markers */}
            {mandis.map(m => (
              <MandiMarker
                key={m.id}
                mandi={m}
                selected={selectedMandi?.id === m.id}
                onPress={handleMarkerPress}
              />
            ))}
          </MapView>

          {/* Empty map state */}
          {mandis.length === 0 && !loading && (
            <View style={styles.emptyOverlay} pointerEvents="none">
              <Text style={styles.emptyOverlayText}>No mandis found within {radiusKm} km</Text>
              <Text style={styles.emptyOverlaySub}>Try increasing the search radius</Text>
            </View>
          )}

          {/* Bottom sheet */}
          <MandiBottomSheet
            mandi={selectedMandi}
            commodities={commodities}
            commoditiesLoading={commoditiesLoading}
            onClose={() => selectMandi(null)}
            onDirections={openDirections}
          />
        </View>
      )}

      {/* ── LIST VIEW ───────────────────────────────────────── */}
      {mode === 'list' && (
        <FlatList
          data={mandis}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MandiListItem
              mandi={item}
              selected={selectedMandi?.id === item.id}
              onPress={m => { selectMandi(m); setMode('map'); }}
            />
          )}
          ListHeaderComponent={<View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.centred}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyTitle}>No mandis found</Text>
              <Text style={styles.emptySub}>Try increasing the radius above</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D7A3A" />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  mapContainer: { flex: 1, position: 'relative' },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  heading:    { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  subheading: { fontSize: 12, color: '#888', marginTop: 2 },
  toggle:     { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3 },
  toggleBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 13, color: '#888' },
  toggleTextActive: { color: '#2D7A3A', fontWeight: '700' },

  // States
  centred:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  errorIcon:   { fontSize: 36, marginBottom: 8 },
  errorText:   { fontSize: 14, color: '#D32F2F', textAlign: 'center', marginBottom: 16 },
  retryBtn:    { backgroundColor: '#2D7A3A', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:   { color: '#fff', fontWeight: '600' },
  emptyIcon:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:  { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  emptySub:    { fontSize: 13, color: '#888', marginTop: 4 },

  // Map empty overlay
  emptyOverlay: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  emptyOverlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyOverlaySub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 },
});
