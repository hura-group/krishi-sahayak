import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { track } from '../../utils/analytics';

export default function SplashScreen() {
  useEffect(() => {
    track('app_open', { source: 'cold_start' });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Krishi Sahayak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2e7d32' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
});