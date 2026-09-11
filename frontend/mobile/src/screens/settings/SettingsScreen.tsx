import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function SettingsScreen() {
  useEffect(() => {
    track('scheme_viewed', { scheme_name: 'PM-KISAN', eligibility_status: 'eligible' });
  }, []);

  return <View><Text>Settings Screen</Text></View>;
}