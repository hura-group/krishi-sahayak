import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/(auth)/otp', params: { phone: `+91${phone}` } });
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-soil-50 justify-center px-4">
      <View className="mb-6">
        <Text className="text-h1 font-sans-bold text-soil-900 text-center mb-2">
          Welcome to KrishiSahayak
        </Text>
        <Text className="text-body font-sans text-soil-600 text-center">
          Enter your mobile number to receive a verification OTP.
        </Text>
      </View>

      <Card variant="default" className="p-4">
        <Text className="text-sm font-sans-semibold text-soil-800 mb-2">Mobile Number</Text>
        <View className="flex-row items-center border border-soil-300 rounded-md px-3 h-12 mb-4 bg-white">
          <Text className="text-body font-sans-semibold text-soil-600 mr-2">+91</Text>
          <TextInput
            className="flex-1 text-body font-sans text-soil-900"
            placeholder="9876543210"
            placeholderTextColor="#A89D86"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Button label="Send OTP" variant="primary" loading={loading} onPress={handleSendOTP} />
      </Card>
    </SafeAreaView>
  );
}
