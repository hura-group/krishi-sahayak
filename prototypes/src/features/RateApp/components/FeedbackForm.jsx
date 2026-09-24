/**
 * src/features/RateApp/components/FeedbackForm.jsx
 *
 * Fallback feedback form shown when the user declines the native rate prompt.
 *
 * UI:
 *   • 5-star tap rating (required)
 *   • Category chips — what they liked / want improved (optional)
 *   • Free-text message input (optional)
 *   • Submit / Cancel
 *
 * Pure presentational — all state and submission logic live in useRateApp.
 *
 * @param {{
 *   onSubmit: (feedback: { starRating: number, categories: string[], message: string }) => void,
 *   onCancel: () => void,
 * }} props
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FEEDBACK_CATEGORIES, STAR_COUNT } from "../constants/rateAppConfig";

// ─── Star rating row ──────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  return (
    <View style={styles.starRow} accessibilityRole="radiogroup" accessibilityLabel="Star rating">
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const star  = i + 1;
        const filled = star <= value;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="radio"
            accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
            accessibilityState={{ checked: filled }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={styles.starButton}
          >
            <Text style={[styles.starIcon, filled && styles.starFilled]}>
              {filled ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Star label ───────────────────────────────────────────────────────────────

const STAR_LABELS = {
  0: "",
  1: "Not happy 😕",
  2: "Could be better 🤔",
  3: "It's okay 😊",
  4: "Really good! 👍",
  5: "Love it! 🌟",
};

// ─── Category chip ────────────────────────────────────────────────────────────

function CategoryChip({ category, selected, onToggle }) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(category.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FeedbackForm({ onSubmit, onCancel }) {
  const [starRating,  setStarRating]  = useState(0);
  const [categories,  setCategories]  = useState([]);
  const [message,     setMessage]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const toggleCategory = useCallback((id) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (starRating === 0) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await onSubmit({ starRating, categories, message });
    } finally {
      setSubmitting(false);
    }
  }, [starRating, categories, message, onSubmit]);

  const canSubmit = starRating > 0 && !submitting;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.kavWrapper}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji} accessibilityElementsHidden>📝</Text>
          <Text style={styles.title}>Share Your Feedback</Text>
          <Text style={styles.subtitle}>
            Help us grow — your thoughts reach our product team directly.
          </Text>
        </View>

        {/* Star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How would you rate KisanSathi?</Text>
          <StarRating value={starRating} onChange={setStarRating} />
          <Text style={styles.starLabel}>{STAR_LABELS[starRating]}</Text>
        </View>

        {/* Category chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What stood out? <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.chipRow}>
            {FEEDBACK_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                selected={categories.includes(cat.id)}
                onToggle={toggleCategory}
              />
            ))}
          </View>
        </View>

        {/* Free text */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Anything specific? <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what you loved or what we could improve…"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            style={styles.textInput}
            textAlignVertical="top"
            accessibilityLabel="Feedback message"
          />
          <Text style={styles.charCount}>{message.length} / 500</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel feedback"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Submit feedback"
            accessibilityState={{ disabled: !canSubmit }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                Send Feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!canSubmit && starRating === 0 && (
          <Text style={styles.hint}>
            ☝️ Please tap a star to continue
          </Text>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kavWrapper: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  optional: {
    fontWeight: "400",
    color: "#9CA3AF",
    fontSize: 12,
  },

  // Stars
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 38,
    color: "#D1D5DB",
  },
  starFilled: {
    color: "#F59E0B",
  },
  starLabel: {
    textAlign: "center",
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    height: 20,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  chipSelected: {
    borderColor: "#0F6E56",
    backgroundColor: "#F0FDF4",
  },
  chipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#0F6E56",
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0F6E56",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  submitText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  submitTextDisabled: {
    color: "#9CA3AF",
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
