import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { track } from '../../utils/analytics';

export default function FarmLocationScreen() {
  const handleCompleteProfile = () => {
    track('profile_completed', {
      state: 'Gujarat',
      land_size_acres: 5,
      crop_count: 2,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farm Location</Text>
      <TouchableOpacity style={styles.button} onPress={handleCompleteProfile}>
        <Text style={styles.buttonText}>Complete Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  button: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 4 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});