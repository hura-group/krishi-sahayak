import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TabBarIconProps = {
  color: string;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* Map only on native — not web */}
      {Platform.OS !== 'web' && (
        <Tabs.Screen
          name="map"
          options={{
            title: 'Mandis',
            tabBarIcon: ({ color }: TabBarIconProps) => (
              <IconSymbol size={26} name="map.fill" color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <IconSymbol size={26} name="bell.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <IconSymbol size={26} name="paperplane.fill" color={color} />
          ),
        }}
      />

    </Tabs>
  );
}