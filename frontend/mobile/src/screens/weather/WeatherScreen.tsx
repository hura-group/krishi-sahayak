import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function WeatherScreen() {
  useEffect(() => {
    track('weather_viewed', { state: 'Gujarat', district: 'Ahmedabad', source: 'bottom_nav' });
  }, []);

  return (
    <View>
      <Text>Weather Screen</Text>
    </View>
  );
}   