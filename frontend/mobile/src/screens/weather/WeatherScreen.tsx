import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { track } from '@/utils/analytics';

export default function WeatherScreen() {
  useEffect(() => {
    track('weather_viewed', { state: 'Gujarat', district: 'Ahmedabad', source: 'bottom_nav' });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Krishi Sahayak UI Library</Text>

      {/* Badges */}
      <View style={styles.row}>
        <Badge label="Healthy" variant="success" />
        <Badge label="Moderate Risk" variant="warning" />
        <Badge label="High Alert" variant="error" />
      </View>

      {/* Card & Inputs */}
      <Card>
        <Text style={styles.cardTitle}>Test Input Component</Text>
        <Input
          label="Target Commodity Price"
          placeholder="e.g. 5200"
          prefix="₹"
          suffix="/qtl"
        />
      </Card>

      {/* Buttons */}
      <View style={styles.buttonStack}>
        <Button title="Primary Action" onPress={() => alert('Primary Clicked')} variant="primary" />
        <Button title="Secondary Action" onPress={() => alert('Secondary Clicked')} variant="secondary" />
        <Button title="Outline Action" onPress={() => alert('Outline Clicked')} variant="outline" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
    paddingTop: 60,
  },
  header: {
    ...tokens.typography.header,
    color: tokens.colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  cardTitle: {
    ...tokens.typography.title,
    marginBottom: tokens.spacing.sm,
  },
  buttonStack: {
    gap: tokens.spacing.sm,
  },
});