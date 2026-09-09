import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyAlertsProps {
  onAdd: () => void;
}

export const EmptyAlerts: React.FC<EmptyAlertsProps> = ({ onAdd }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>🔔</Text>
    <Text style={styles.title}>No price alerts yet</Text>
    <Text style={styles.sub}>
      Set alerts for your crops and we'll notify{'\n'}you the moment prices move.
    </Text>
    <TouchableOpacity style={styles.btn} onPress={onAdd}>
      <Text style={styles.btnText}>+ Create Your First Alert</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon:      { fontSize: 56, marginBottom: 16 },
  title:     { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  sub:       { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn: {
    backgroundColor: '#2D7A3A', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
