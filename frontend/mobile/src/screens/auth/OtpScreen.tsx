import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { track, identify } from '../../utils/analytics';

export default function OtpScreen() {
  const [otp, setOtp] = useState('');

  const handleSendOtp = () => {
    track('otp_sent');
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      track('otp_verified');
      identify('farmer_user_123', { role: 'farmer' });
    } else {
      track('otp_failed', { attempt_number: 1 });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter 6-digit OTP"
      />
      <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, width: '80%', marginBottom: 12, borderRadius: 4 },
  button: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 4, width: '80%', alignItems: 'center', marginVertical: 4 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});