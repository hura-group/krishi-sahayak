/**
 * src/features/RateApp/components/RateAppPrompt.jsx
 *
 * Full Rate App flow orchestrator — renders the correct UI for each
 * state-machine step as a bottom sheet Modal.
 *
 * State → UI mapping:
 *   RATE_PROMPT   → Custom "Enjoying KisanSathi?" bottom sheet
 *   FEEDBACK_FORM → FeedbackForm inside a taller bottom sheet
 *   THANKYOU      → Brief thank-you confirmation
 *   HIDDEN        → null (renders nothing)
 *
 * Usage (mount once in your root navigator or App.js):
 *
 *   import { useRateApp, useAppOpenTracker, RateAppPrompt } from "@/features/RateApp";
 *
 *   export default function App() {
 *     const rateApp = useRateApp();
 *     useAppOpenTracker({ onEligible: rateApp.maybeShow });
 *
 *     return (
 *       <NavigationContainer>
 *         <RootStack />
 *         <RateAppPrompt controller={rateApp} />
 *       </NavigationContainer>
 *     );
 *   }
 *
 * @param {{ controller: ReturnType<import("../hooks/useRateApp").useRateApp> }} props
 */

import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import FeedbackForm from "./FeedbackForm";
import { RATE_APP_STATE } from "../hooks/useRateApp";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Rate prompt sheet content ────────────────────────────────────────────────

function RatePromptContent({ onRateNow, onGiveFeedback, onDismiss }) {
  return (
    <View style={styles.promptContent}>

      {/* App icon placeholder + stars */}
      <View style={styles.promptIconWrap}>
        <View style={styles.promptIcon}>
          <Text style={styles.promptIconEmoji}>🌾</Text>
        </View>
        <View style={styles.promptStars}>
          {["★", "★", "★", "★", "★"].map((s, i) => (
            <Text key={i} style={styles.promptStarGlyph}>{s}</Text>
          ))}
        </View>
      </View>

      {/* Copy */}
      <Text style={styles.promptTitle}>Enjoying KisanSathi?</Text>
      <Text style={styles.promptSubtitle}>
        Your review helps other farmers discover us — and takes less than 30 seconds.
      </Text>

      {/* Primary CTA */}
      <TouchableOpacity
        onPress={onRateNow}
        style={styles.rateButton}
        accessibilityRole="button"
        accessibilityLabel="Rate KisanSathi on the app store"
      >
        <Text style={styles.rateButtonText}>⭐  Rate KisanSathi</Text>
      </TouchableOpacity>

      {/* Secondary CTAs */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          onPress={onGiveFeedback}
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Give feedback instead"
        >
          <Text style={styles.secondaryText}>Give Feedback</Text>
        </TouchableOpacity>

        <View style={styles.secondaryDivider} />

        <TouchableOpacity
          onPress={onDismiss}
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Remind me later"
        >
          <Text style={styles.secondaryText}>Later</Text>
        </TouchableOpacity>
      </View>

      {/* Fine print */}
      <Text style={styles.finePrint}>
        We'll remind you again in 90 days if you choose "Later".
      </Text>
    </View>
  );
}

// ─── Thank-you content ────────────────────────────────────────────────────────

function ThankYouContent() {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.thankYouContent}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <Text style={styles.thankYouEmoji}>🙏</Text>
      </Animated.View>
      <Text style={styles.thankYouTitle}>Thank you!</Text>
      <Text style={styles.thankYouSubtitle}>
        Your feedback goes straight to our product team. We'll keep making KisanSathi better for every farmer.
      </Text>
    </View>
  );
}

// ─── Sheet wrapper with slide-up animation ────────────────────────────────────

function BottomSheet({ visible, onBackdropPress, children, tall = false }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue:         0,
        useNativeDriver: true,
        tension:         70,
        friction:        12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue:         SCREEN_HEIGHT,
        duration:        220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onBackdropPress}
        accessibilityLabel="Close"
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          tall && styles.sheetTall,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} accessibilityElementsHidden />
        {children}
      </Animated.View>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RateAppPrompt({ controller }) {
  const {
    isVisible,
    showRatePrompt,
    showFeedbackForm,
    showThankYou,
    onRateNow,
    onGiveFeedback,
    onDismissPrompt,
    onFeedbackSubmit,
    onFeedbackCancel,
  } = controller;

  if (!isVisible) return null;

  // Thank-you auto-closes — no interaction needed
  const isThankyou = showThankYou;

  return (
    <BottomSheet
      visible={isVisible}
      onBackdropPress={showFeedbackForm ? onFeedbackCancel : onDismissPrompt}
      tall={showFeedbackForm}
    >
      {showRatePrompt && (
        <RatePromptContent
          onRateNow={onRateNow}
          onGiveFeedback={onGiveFeedback}
          onDismiss={onDismissPrompt}
        />
      )}

      {showFeedbackForm && (
        <FeedbackForm
          onSubmit={onFeedbackSubmit}
          onCancel={onFeedbackCancel}
        />
      )}

      {isThankyou && <ThankYouContent />}
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  // Bottom sheet
  sheet: {
    position:        "absolute",
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingBottom:   Platform.OS === "ios" ? 34 : 20,
    maxHeight:       SCREEN_HEIGHT * 0.65,
    // Shadow
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: -4 },
    shadowOpacity:   0.12,
    shadowRadius:    16,
    elevation:       16,
  },
  sheetTall: {
    maxHeight: SCREEN_HEIGHT * 0.92,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: "#E5E7EB",
    alignSelf:       "center",
    marginTop:       10,
    marginBottom:    6,
  },

  // ── Rate prompt ──
  promptContent: {
    paddingHorizontal: 24,
    paddingTop:        12,
    paddingBottom:     8,
    alignItems:        "center",
  },
  promptIconWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  promptIcon: {
    width:           72,
    height:          72,
    borderRadius:    18,
    backgroundColor: "#F0FDF4",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    10,
    borderWidth:     1.5,
    borderColor:     "#BBF7D0",
  },
  promptIconEmoji: {
    fontSize: 36,
  },
  promptStars: {
    flexDirection: "row",
    gap:           3,
  },
  promptStarGlyph: {
    fontSize:  24,
    color:     "#F59E0B",
  },
  promptTitle: {
    fontSize:     22,
    fontWeight:   "700",
    color:        "#111827",
    textAlign:    "center",
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize:     14,
    color:        "#6B7280",
    textAlign:    "center",
    lineHeight:   20,
    marginBottom: 24,
  },
  rateButton: {
    width:           "100%",
    paddingVertical: 15,
    borderRadius:    14,
    backgroundColor: "#0F6E56",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    12,
    shadowColor:     "#0F6E56",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.28,
    shadowRadius:    8,
    elevation:       6,
  },
  rateButtonText: {
    fontSize:    16,
    fontWeight:  "700",
    color:       "#FFFFFF",
    letterSpacing: 0.2,
  },
  secondaryRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   14,
    width:          "100%",
  },
  secondaryButton: {
    flex:            1,
    paddingVertical: 12,
    alignItems:      "center",
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  secondaryText: {
    fontSize:   14,
    color:      "#374151",
    fontWeight: "500",
  },
  secondaryDivider: {
    width:            8,
  },
  finePrint: {
    fontSize:    11,
    color:       "#9CA3AF",
    textAlign:   "center",
    lineHeight:  16,
    paddingBottom: 4,
  },

  // ── Thank you ──
  thankYouContent: {
    alignItems:        "center",
    paddingHorizontal: 28,
    paddingTop:        20,
    paddingBottom:     24,
  },
  thankYouEmoji: {
    fontSize:     52,
    marginBottom: 14,
  },
  thankYouTitle: {
    fontSize:     22,
    fontWeight:   "700",
    color:        "#111827",
    marginBottom: 10,
  },
  thankYouSubtitle: {
    fontSize:  14,
    color:     "#6B7280",
    textAlign: "center",
    lineHeight: 21,
  },
});
