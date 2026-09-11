import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function CommunityFeedScreen() {
  useEffect(() => {
    track('post_created', { category: 'Crops', has_image: false, character_count: 50 });
  }, []);

  return <View><Text>Community Screen</Text></View>;
}