import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/');
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-soil-50 justify-center px-4">
      <View className="mb-6">
        <Text className="text-h1 font-sans-bold text-soil-900 text-center mb-2">Verify Phone</Text>
        <Text className="text-body font-sans text-soil-600 text-center">
          Code sent to {phone || '+91 9876543210'}
        </Text>
      </View>

      <Card variant="default" className="p-4">
        <Text className="text-sm font-sans-semibold text-soil-800 mb-2">Enter OTP</Text>
        <TextInput
          className="border border-soil-300 rounded-md px-3 h-12 text-h2 font-sans-bold text-soil-900 text-center tracking-widest mb-4 bg-white"
          placeholder="123456"
          placeholderTextColor="#A89D86"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        <Button
          label="Verify & Continue"
          variant="primary"
          loading={loading}
          onPress={handleVerifyOTP}
        />
      </Card>
    </SafeAreaView>
  );
}
