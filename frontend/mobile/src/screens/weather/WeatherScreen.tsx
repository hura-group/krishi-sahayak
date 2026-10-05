import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { tokens } from '@/theme/tokens';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { track } from '@/utils/analytics';

const FORECAST_DATA = [
  { day: 'Today', temp: '32°C', icon: '☀️️', condition: 'Sunny', rainProb: '10%' },
  { day: 'Tue', temp: '30°C', icon: '⛅', condition: 'Partly Cloudy', rainProb: '25%' },
  { day: 'Wed', temp: '27°C', icon: '🌧️', condition: 'Moderate Rain', rainProb: '80%' },
  { day: 'Thu', temp: '28°C', icon: '🌦️', condition: 'Light Showers', rainProb: '45%' },
  { day: 'Fri', temp: '31°C', icon: '☀️', condition: 'Clear Sky', rainProb: '5%' },
];

const ADVISORIES = [
  {
    id: '1',
    crop: 'Wheat / Paddy',
    title: 'Postpone Pesticide Spraying',
    description: 'Heavy rainfall predicted on Wednesday. Avoid chemical spraying to prevent runoff loss.',
    severity: 'warning' as const,
  },
  {
    id: '2',
    crop: 'Cotton / Groundnut',
    title: 'Optimal Irrigation Window',
    description: 'Clear sunny weather expected today and Tuesday. Favorable conditions for field irrigation.',
    severity: 'success' as const,
  },
];

export default function WeatherScreen() {
  const [selectedDay, setSelectedDay] = useState('Today');

  useEffect(() => {
    track('weather_viewed', { state: 'Gujarat', district: 'Ahmedabad', source: 'bottom_nav' });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Location Header */}
      <View style={styles.locationHeader}>
        <Text style={styles.locationTitle}>📍 Ahmedabad, Gujarat</Text>
        <Text style={styles.locationSub}>Updated 10 mins ago</Text>
      </View>

      {/* Main Weather Hero Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.tempText}>32°C</Text>
            <Text style={styles.conditionText}>Mostly Sunny</Text>
            <Text style={styles.humidityText}>Humidity: 65% | Wind: 12 km/h</Text>
          </View>
          <Text style={styles.heroIcon}>☀️</Text>
        </View>
      </Card>

      {/* 5-Day Forecast */}
      <Text style={styles.sectionTitle}>5-Day Forecast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastRow}>
        {FORECAST_DATA.map((item) => (
          <TouchableOpacity
            key={item.day}
            onPress={() => setSelectedDay(item.day)}
            style={[
              styles.forecastCard,
              selectedDay === item.day && styles.activeForecastCard,
            ]}
          >
            <Text style={styles.forecastDay}>{item.day}</Text>
            <Text style={styles.forecastIcon}>{item.icon}</Text>
            <Text style={styles.forecastTemp}>{item.temp}</Text>
            <Text style={styles.forecastRain}>💧 {item.rainProb}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Agricultural Advisories */}
      <View style={styles.advisoryHeader}>
        <Text style={styles.sectionTitle}>Crop Weather Advisories</Text>
        <Badge label="Live Alert" variant="warning" />
      </View>

      {ADVISORIES.map((adv) => (
        <Card key={adv.id} style={styles.advisoryCard}>
          <View style={styles.advisoryTop}>
            <Text style={styles.cropTag}>{adv.crop}</Text>
            <Badge label={adv.severity === 'warning' ? 'Action Required' : 'Optimal'} variant={adv.severity} />
          </View>
          <Text style={styles.advisoryTitle}>{adv.title}</Text>
          <Text style={styles.advisoryDesc}>{adv.description}</Text>
        </Card>
      ))}

      {/* Refresh Data Action */}
      <Button
        title="🔄 Refresh Weather Data"
        onPress={() => alert('Weather data refreshed!')}
        variant="outline"
        style={styles.refreshBtn}
      />
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
    paddingTop: 50,
  },
  locationHeader: {
    marginBottom: tokens.spacing.xs,
  },
  locationTitle: {
    ...tokens.typography.header,
    color: tokens.colors.textPrimary,
  },
  locationSub: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
  heroCard: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 36,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  conditionText: {
    ...tokens.typography.title,
    color: tokens.colors.textPrimary,
  },
  humidityText: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
    marginTop: 4,
  },
  heroIcon: {
    fontSize: 54,
  },
  sectionTitle: {
    ...tokens.typography.title,
    color: tokens.colors.textPrimary,
  },
  forecastRow: {
    flexDirection: 'row',
  },
  forecastCard: {
    backgroundColor: tokens.colors.cardBackground,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginRight: tokens.spacing.xs,
    minWidth: 80,
  },
  activeForecastCard: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
    borderWidth: 1.5,
  },
  forecastDay: {
    ...tokens.typography.caption,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  forecastIcon: {
    fontSize: 24,
    marginVertical: 4,
  },
  forecastTemp: {
    ...tokens.typography.body,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  forecastRain: {
    fontSize: 10,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  advisoryCard: {
    gap: tokens.spacing.xs,
  },
  advisoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTag: {
    ...tokens.typography.caption,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  advisoryTitle: {
    ...tokens.typography.title,
    fontSize: 16,
    color: tokens.colors.textPrimary,
  },
  advisoryDesc: {
    ...tokens.typography.body,
    color: tokens.colors.textSecondary,
  },
  refreshBtn: {
    marginTop: tokens.spacing.sm,
  },
});