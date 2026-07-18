import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

// Web version of map screen
// Maps not supported on web — use mobile app
export default function MandiMapScreenWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.title}>Mandi Locator</Text>
      <Text style={styles.subtitle}>
        Map view is available on the mobile app.{'\n'}
        Download KrishiSahayak on your Android phone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#F5F5F5',
    padding:         32,
  },
  emoji: {
    fontSize:     64,
    marginBottom: 16,
  },
  title: {
    fontSize:     24,
    fontWeight:   '700',
    color:        '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize:   15,
    color:      '#888',
    textAlign:  'center',
    lineHeight: 24,
  },
});