import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { track } from '../../utils/analytics';

export default function MandiMapScreen() {
  useEffect(() => {
    track('mandi_locator_viewed');
  }, []);

  return (
    <View style={styles.webContainer}>
      <Text style={styles.title}>Mandi Locator</Text>
      <Text style={styles.subtitle}>
        Interactive maps are available on iOS & Android native apps.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#4b5563', marginTop: 8, textAlign: 'center' },
});