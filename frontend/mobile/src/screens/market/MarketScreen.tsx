import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function MarketScreen() {
  useEffect(() => {
    track('market_price_viewed', { commodity: 'Wheat', state: 'Gujarat', source: 'bottom_nav' });
  }, []);

  return <View><Text>Market Screen</Text></View>;
}