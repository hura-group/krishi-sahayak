import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function ListingDetailScreen() {
  useEffect(() => {
    track('marketplace_listing_viewed', { listing_category: 'Tractor', state: 'Gujarat', source: 'grid' });
  }, []);

  return <View><Text>Listing Detail Screen</Text></View>;
}