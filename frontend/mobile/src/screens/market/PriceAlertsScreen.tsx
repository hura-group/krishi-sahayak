import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { tokens } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { track, type EventName } from '@/utils/analytics';

const CROPS = [
  'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar',
  'Cotton', 'Groundnut', 'Soybean', 'Sugarcane',
  'Onion', 'Potato', 'Tomato', 'Mustard', 'Tur Dal',
];

const STATES = [
  'Gujarat', 'Maharashtra', 'Punjab', 'Haryana',
  'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan',
  'Karnataka', 'Andhra Pradesh', 'Telangana',
  'Tamil Nadu', 'West Bengal', 'Bihar',
];

export default function PriceAlertsScreen() {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'HISTORY'>('ALERTS');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modal Flow States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'CHOOSE_CROP' | 'SET_ALERT'>('CHOOSE_CROP');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [selectedState, setSelectedState] = useState('Gujarat');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');

  useEffect(() => {
    track('price_alerts_viewed' as any, { tab: activeTab } as any);
  }, [activeTab]);

  const handleOpenNewAlert = () => {
    setModalStep('CHOOSE_CROP');
    setIsModalVisible(true);
    track('price_alert_modal_opened' as any);
  };

  const handleSelectCrop = (crop: string) => {
    setSelectedCrop(crop);
    setModalStep('SET_ALERT');
  };

  const handleSetAlert = () => {
    track('price_alert_created' as any, {
      commodity: selectedCrop,
      state: selectedState,
      condition,
      targetPrice,
    } as any);
    setIsModalVisible(false);
    alert(`Alert active for ${selectedCrop} in ${selectedState} when price goes ${condition.toLowerCase()} ₹${targetPrice}/qtl`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.title}>Price Alerts</Text>
          <Text style={styles.subTitle}>No alerts set</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleOpenNewAlert}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALERTS' ? styles.activeTab : null]}
          onPress={() => setActiveTab('ALERTS')}
        >
          <Text style={[styles.tabText, activeTab === 'ALERTS' ? styles.activeTabText : null]}>
            My Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'HISTORY' ? styles.activeTab : null]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' ? styles.activeTabText : null]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'ALERTS' ? (
          !isAuthenticated ? (
            <View style={styles.centerView}>
              <Text style={styles.authErrorText}>⚠️ Not authenticated</Text>
              <Button
                title="Retry"
                onPress={() => setIsAuthenticated(true)}
                variant="primary"
                style={styles.retryBtn}
              />
            </View>
          ) : (
            <View style={styles.centerView}>
              <Text style={styles.emptyTitle}>No active alerts</Text>
              <Text style={styles.emptySub}>Tap “+ New” above to set your first alert.</Text>
            </View>
          )
        ) : (
          <View style={styles.centerView}>
            <Text style={styles.mailboxIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No alerts triggered yet</Text>
            <Text style={styles.emptySub}>
              Your alert history will appear here once prices hit your targets.
            </Text>
          </View>
        )}
      </View>

      {/* Two-Step Modal Sheet */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />

            {modalStep === 'CHOOSE_CROP' ? (
              /* STEP 1: CHOOSE CROP */
              <View style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Choose Crop</Text>
                  <View style={{ width: 20 }} />
                </View>

                <Text style={styles.stepSubtitle}>Which crop do you want to track?</Text>

                <ScrollView contentContainerStyle={styles.cropGrid}>
                  {CROPS.map((crop) => (
                    <TouchableOpacity
                      key={crop}
                      style={styles.cropChip}
                      onPress={() => handleSelectCrop(crop)}
                    >
                      <Text style={styles.cropChipText}>{crop}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* STEP 2: SET ALERT FORM */
              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setModalStep('CHOOSE_CROP')}>
                    <Text style={styles.backBtn}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Set Alert</Text>
                  <View style={{ width: 40 }} />
                </View>

                <Text style={styles.cropHeading}>🌾 {selectedCrop}</Text>

                {/* State Chips */}
                <Text style={styles.fieldLabel}>State</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {STATES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.stateChip, selectedState === st ? styles.activeStateChip : null]}
                      onPress={() => setSelectedState(st)}
                    >
                      <Text style={[styles.stateChipText, selectedState === st ? styles.activeStateChipText : null]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Condition Toggle */}
                <Text style={styles.fieldLabel}>Alert me when price is</Text>
                <View style={styles.segmentRow}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, condition === 'ABOVE' ? styles.activeSegmentBtn : null]}
                    onPress={() => setCondition('ABOVE')}
                  >
                    <Text style={[styles.segmentText, condition === 'ABOVE' ? styles.activeSegmentText : null]}>
                      ▲ Above
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentBtn, condition === 'BELOW' ? styles.activeSegmentBtn : null]}
                    onPress={() => setCondition('BELOW')}
                  >
                    <Text style={[styles.segmentText, condition === 'BELOW' ? styles.activeSegmentText : null]}>
                      ▼ Below
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Target Price Input */}
                <Input
                  label="Target Price (₹ per quintal)"
                  placeholder="e.g. 2400"
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="numeric"
                  prefix="₹"
                  suffix="/qtl"
                />

                {/* Live Notification Banner */}
                {Boolean(targetPrice) && (
                  <View style={styles.summaryBanner}>
                    <Text style={styles.summaryText}>
                      🔔 Notify me when <Text style={styles.boldText}>{selectedCrop}</Text> {condition === 'ABOVE' ? '>' : '<'} <Text style={styles.boldText}>₹{targetPrice}/qtl</Text> in {selectedState}
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <Button
                  title="Set Alert →"
                  onPress={handleSetAlert}
                  variant="primary"
                  style={styles.submitBtn}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: 50,
    paddingBottom: tokens.spacing.sm,
    backgroundColor: '#ffffff',
  },
  title: {
    ...tokens.typography.header,
    color: tokens.colors.textPrimary,
  },
  subTitle: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
  newBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 8,
    borderRadius: tokens.borderRadius.sm,
  },
  newBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.primary,
  },
  tabText: {
    ...tokens.typography.body,
    color: tokens.colors.textSecondary,
  },
  activeTabText: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  authErrorText: {
    color: tokens.colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: tokens.spacing.md,
  },
  retryBtn: {
    minWidth: 120,
  },
  mailboxIcon: {
    fontSize: 48,
    marginBottom: tokens.spacing.sm,
  },
  emptyTitle: {
    ...tokens.typography.title,
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalBody: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingBottom: tokens.spacing.xs,
  },
  closeBtn: {
    fontSize: 18,
    color: tokens.colors.textSecondary,
  },
  backBtn: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
  },
  modalTitle: {
    ...tokens.typography.title,
    color: tokens.colors.textPrimary,
  },
  stepSubtitle: {
    ...tokens.typography.body,
    color: tokens.colors.textSecondary,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  cropChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: '#f3f4f6',
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  cropChipText: {
    ...tokens.typography.body,
    color: tokens.colors.textPrimary,
  },
  cropHeading: {
    ...tokens.typography.header,
    color: tokens.colors.primary,
  },
  fieldLabel: {
    ...tokens.typography.caption,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  stateChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginRight: tokens.spacing.xs,
  },
  activeStateChip: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  stateChipText: {
    ...tokens.typography.caption,
    color: tokens.colors.textSecondary,
  },
  activeStateChipText: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  activeSegmentBtn: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  segmentText: {
    ...tokens.typography.body,
    color: tokens.colors.textSecondary,
  },
  activeSegmentText: {
    color: tokens.colors.primary,
    fontWeight: '700',
  },
  summaryBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.secondary,
    padding: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.sm,
  },
  summaryText: {
    ...tokens.typography.caption,
    color: '#92400e',
  },
  boldText: {
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: tokens.spacing.xs,
  },
});