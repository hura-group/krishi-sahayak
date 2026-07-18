import React, { memo } from 'react';
import { View } from 'react-native';
import { Mandi } from '../../src/services/mandiLocatorService';

interface MandiMarkerProps {
  mandi:    Mandi;
  selected: boolean;
  onPress:  (mandi: Mandi) => void;
}

// Web version — no maps, just empty component
export const MandiMarker: React.FC<MandiMarkerProps> = memo(() => {
  return <View />;
});