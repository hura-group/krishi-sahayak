import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function CameraScreen() {
  useEffect(() => {
    track('pest_scan_started', { source: 'fab_button' });
  }, []);

  return <View><Text>Camera Screen</Text></View>;
}