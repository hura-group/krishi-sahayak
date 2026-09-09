import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCondition, CreateAlertPayload } from '../../src/services/priceAlertService';

const CROPS = [
  'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar', 'Cotton', 'Groundnut',
  'Soybean', 'Sugarcane', 'Onion', 'Potato', 'Tomato', 'Mustard', 'Tur Dal',
];

const INDIAN_STATES = [
  'Gujarat', 'Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh',
  'Madhya Pradesh', 'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'Telangana',
  'Tamil Nadu', 'West Bengal', 'Bihar', 'Odisha', 'Chhattisgarh',
];

interface CreateAlertSheetProps {
  visible:   boolean;
  creating:  boolean;
  onClose:   () => void;
  onCreate:  (payload: CreateAlertPayload) => Promise<void>;
}

export const CreateAlertSheet: React.FC<CreateAlertSheetProps> = ({
  visible, creating, onClose, onCreate,
}) => {
  const [step,      setStep]      = useState<'crop' | 'setup'>('crop');
  const [crop,      setCrop]      = useState('');
  const [state,     setState]     = useState('Gujarat');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [price,     setPrice]     = useState('');
  const [error,     setError]     = useState('');

  const reset = () => {
    setStep('crop'); setCrop(''); setState('Gujarat');
    setCondition('above'); setPrice(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    const num = parseFloat(price);
    if (!crop)         return setError('Please select a crop');
    if (!price || isNaN(num) || num <= 0) return setError('Enter a valid price');
    if (num > 100000)  return setError('Price seems too high — enter ₹/quintal');

    setError('');
    await onCreate({ crop_name: crop, state, condition, target_price_per_qtl: num });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={step === 'setup' ? () => setStep('crop') : handleClose}>
              <Text style={styles.backBtn}>{step === 'setup' ? '← Back' : '✕'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 'crop' ? 'Choose Crop' : 'Set Alert'}
            </Text>
            <View style={{ width: 48 }} />
          </View>

          {step === 'crop' ? (
            /* ── Step 1: Pick crop ─────────────────────────── */
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.hint}>Which crop do you want to track?</Text>
              <View style={styles.cropGrid}>
                {CROPS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cropChip, crop === c && styles.cropChipSelected]}
                    onPress={() => { setCrop(c); setStep('setup'); }}
                  >
                    <Text style={[styles.cropChipText, crop === c && styles.cropChipTextSelected]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            /* ── Step 2: Configure condition + price ───────── */
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              {/* Crop label */}
              <View style={styles.selectedCropRow}>
                <Text style={styles.selectedCropLabel}>🌾 {crop}</Text>
              </View>

              {/* State picker */}
              <Text style={styles.sectionLabel}>State</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateRow}>
                {INDIAN_STATES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.stateChip, state === s && styles.stateChipActive]}
                    onPress={() => setState(s)}
                  >
                    <Text style={[styles.stateChipText, state === s && styles.stateChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Condition toggle */}
              <Text style={styles.sectionLabel}>Alert me when price is</Text>
              <View style={styles.condRow}>
                <TouchableOpacity
                  style={[styles.condBtn, condition === 'above' && styles.condBtnAbove]}
                  onPress={() => setCondition('above')}
                >
                  <Text style={[styles.condBtnText, condition === 'above' && styles.condBtnTextActive]}>
                    ▲ Above
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.condBtn, condition === 'below' && styles.condBtnBelow]}
                  onPress={() => setCondition('below')}
                >
                  <Text style={[styles.condBtnText, condition === 'below' && styles.condBtnTextActive]}>
                    ▼ Below
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Price input */}
              <Text style={styles.sectionLabel}>Target Price (₹ per quintal)</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={t => { setPrice(t); setError(''); }}
                  keyboardType="numeric"
                  placeholder="e.g. 2400"
                  placeholderTextColor="#BDBDBD"
                  returnKeyType="done"
                  autoFocus
                />
                <Text style={styles.unit}>/qtl</Text>
              </View>

              {/* Preview */}
              {price && !isNaN(parseFloat(price)) && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewText}>
                    🔔 Notify me when{' '}
                    <Text style={styles.previewBold}>{crop}</Text>
                    {' '}{condition === 'above' ? '>' : '<'}{' '}
                    <Text style={styles.previewBold}>
                      ₹{parseFloat(price).toLocaleString('en-IN')}/qtl
                    </Text>
                    {' '}in {state}
                  </Text>
                </View>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Create button */}
              <TouchableOpacity
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.createBtnText}>Set Alert →</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  backBtn: { fontSize: 14, color: '#555', width: 48 },
  title:   { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  body:    { padding: 16 },
  hint:    { fontSize: 14, color: '#666', marginBottom: 14 },

  // Crop grid
  cropGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cropChip:   {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0',
  },
  cropChipSelected:     { backgroundColor: '#2D7A3A', borderColor: '#2D7A3A' },
  cropChipText:         { fontSize: 14, color: '#333' },
  cropChipTextSelected: { color: '#fff', fontWeight: '700' },

  // Selected crop
  selectedCropRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  selectedCropLabel: { fontSize: 20, fontWeight: '700', color: '#2D7A3A' },

  // State
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  stateRow:     { marginBottom: 4 },
  stateChip:    {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F0F0F0', marginRight: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  stateChipActive:     { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  stateChipText:       { fontSize: 13, color: '#444' },
  stateChipTextActive: { color: '#1565C0', fontWeight: '600' },

  // Condition
  condRow:   { flexDirection: 'row', gap: 12, marginBottom: 4 },
  condBtn:   {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: 'transparent',
  },
  condBtnAbove:        { backgroundColor: '#E8F5E9', borderColor: '#2D7A3A' },
  condBtnBelow:        { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
  condBtnText:         { fontSize: 15, fontWeight: '600', color: '#888' },
  condBtnTextActive:   { color: '#1A1A1A' },

  // Price input
  priceInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0',
    paddingHorizontal: 14, marginBottom: 4,
  },
  rupeeSymbol: { fontSize: 22, color: '#444', marginRight: 4 },
  priceInput:  { flex: 1, fontSize: 28, fontWeight: '700', color: '#1A1A1A', paddingVertical: 14 },
  unit:        { fontSize: 14, color: '#888', marginLeft: 4 },

  // Preview
  previewBox: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12,
    marginTop: 12, borderLeftWidth: 3, borderLeftColor: '#FFA000',
  },
  previewText:  { fontSize: 14, color: '#555', lineHeight: 20 },
  previewBold:  { fontWeight: '700', color: '#1A1A1A' },

  errorText: { color: '#D32F2F', fontSize: 13, marginTop: 8 },

  createBtn: {
    backgroundColor: '#2D7A3A', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
