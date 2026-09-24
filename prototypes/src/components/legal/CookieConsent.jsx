/**
 * src/components/legal/CookieConsent.jsx
 *
 * GDPR-compliant cookie consent banner with a preferences panel.
 *
 * States:
 *   BANNER      — initial slide-up bar with Accept All / Reject / Customise
 *   PREFERENCES — full panel with per-category toggles
 *   HIDDEN      — dismissed (user has decided)
 *
 * Mount once at the app root (e.g. in app/layout.jsx):
 *   <CookieConsent />
 *
 * The banner does NOT render on the server (client component).
 * It reads persisted consent from useCookieConsent on mount.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal on the preferences panel
 *   - Focus trapped inside the preferences panel while open
 *   - Keyboard: Escape closes panel
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  useCookieConsent,
  CONSENT_CATEGORIES,
} from "@/hooks/useCookieConsent";

// ─── CSS injection ────────────────────────────────────────────────────────────

const CSS = `
@keyframes cc-slide-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cc-panel-in {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cc-overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cc-styles")) return;
  const tag = document.createElement("style");
  tag.id = "cc-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width:          44,
        height:         24,
        borderRadius:   12,
        border:         "none",
        background:     disabled ? "#D1FAE5" : checked ? "#0F6E56" : "#D1D5DB",
        cursor:         disabled ? "not-allowed" : "pointer",
        position:       "relative",
        flexShrink:     0,
        transition:     "background 0.2s",
        opacity:        disabled ? 0.7 : 1,
      }}
      aria-label={disabled ? "Always active" : checked ? "Enabled" : "Disabled"}
    >
      <span
        aria-hidden="true"
        style={{
          position:     "absolute",
          top:          2,
          left:         checked || disabled ? 22 : 2,
          width:        20,
          height:       20,
          borderRadius: "50%",
          background:   "#fff",
          transition:   "left 0.2s",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ─── Preferences panel ────────────────────────────────────────────────────────

function PreferencesPanel({ draft, onToggle, onSave, onClose, onAcceptAll, onRejectAll }) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus panel on open
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9997,
          animation: "cc-overlay-in 0.2s ease",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        tabIndex={-1}
        style={{
          position:     "fixed",
          bottom:       0,
          left:         0,
          right:        0,
          maxHeight:    "90vh",
          overflowY:    "auto",
          background:   "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow:    "0 -8px 40px rgba(0,0,0,0.15)",
          zIndex:       9998,
          animation:    "cc-panel-in 0.3s cubic-bezier(0.34,1.2,0.64,1)",
          outline:      "none",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#111" }}>
            <i className="ti ti-cookie" style={{ marginRight: 8, fontSize: 17, color: "#0F6E56" }} aria-hidden="true" />
            Cookie Preferences
          </h2>
          <button
            onClick={onClose}
            aria-label="Close preferences"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6B7280" }}
          >
            <i className="ti ti-x" style={{ fontSize: 18 }} aria-hidden="true" />
          </button>
        </div>

        <p style={{ margin: "10px 20px 16px", fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          We use cookies and similar technologies to provide our service, improve your experience, and — with your consent — track usage and show relevant ads.{" "}
          <Link href="/privacy#cookies" style={{ color: "#0F6E56" }}>Learn more</Link>
        </p>

        {/* Categories */}
        <div style={{ padding: "0 20px 16px" }}>
          {CONSENT_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              style={{
                display:      "flex",
                gap:          14,
                alignItems:   "flex-start",
                padding:      "14px 0",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <Toggle
                id={`toggle-${cat.id}`}
                checked={cat.alwaysOn || draft[cat.id]}
                onChange={(val) => onToggle(cat.id, val)}
                disabled={cat.alwaysOn}
              />
              <div style={{ flex: 1 }}>
                <label
                  htmlFor={`toggle-${cat.id}`}
                  style={{ fontSize: 14, fontWeight: 500, color: "#111", display: "block", marginBottom: 3, cursor: cat.alwaysOn ? "default" : "pointer" }}
                >
                  {cat.label}
                  {cat.alwaysOn && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: "#0F6E56", background: "#D1FAE5", padding: "1px 6px", borderRadius: 6 }}>
                      Always active
                    </span>
                  )}
                </label>
                <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 20px 28px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={onRejectAll}
            style={{ flex: 1, minWidth: 120, padding: "11px 0", background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Reject All
          </button>
          <button
            onClick={onSave}
            style={{ flex: 1, minWidth: 120, padding: "11px 0", background: "#F0FDF4", color: "#0F6E56", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Save My Choices
          </button>
          <button
            onClick={onAcceptAll}
            style={{ flex: 1, minWidth: 120, padding: "11px 0", background: "#0F6E56", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Accept All
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main banner ──────────────────────────────────────────────────────────────

export default function CookieConsent() {
  injectCSS();

  const {
    hasDecided,
    settingsOpen,
    acceptAll,
    rejectAll,
    saveConsent,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  // Local draft for the preferences panel
  const [draft, setDraft] = useState({
    analytics:       false,
    personalisation: false,
    marketing:       false,
  });

  const handleToggle = useCallback((id, val) => {
    setDraft((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleSave = useCallback(() => {
    saveConsent(draft);
  }, [saveConsent, draft]);

  // Don't render anything until client-side hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      {/* ── Banner (shown until user decides) ── */}
      {!hasDecided && !settingsOpen && (
        <div
          role="region"
          aria-label="Cookie consent"
          style={{
            position:     "fixed",
            bottom:       16,
            left:         16,
            right:        16,
            maxWidth:     560,
            margin:       "0 auto",
            background:   "#fff",
            borderRadius: 16,
            boxShadow:    "0 8px 40px rgba(0,0,0,0.14)",
            padding:      "18px 20px",
            zIndex:       9996,
            animation:    "cc-slide-up 0.4s cubic-bezier(0.34,1.2,0.64,1)",
            border:       "1px solid #E5E7EB",
          }}
        >
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div
              aria-hidden="true"
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <i className="ti ti-cookie" style={{ fontSize: 18, color: "#0F6E56" }} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#111" }}>
                We use cookies
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                We use cookies to improve your experience and show relevant market data.{" "}
                <Link href="/privacy#cookies" style={{ color: "#0F6E56", fontWeight: 500 }}>
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={rejectAll}
              style={{ padding: "8px 16px", background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", flex: "0 0 auto" }}
            >
              Reject All
            </button>
            <button
              onClick={openSettings}
              style={{ padding: "8px 16px", background: "#F0FDF4", color: "#0F6E56", border: "1px solid #BBF7D0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", flex: "0 0 auto" }}
            >
              Customise
            </button>
            <button
              onClick={acceptAll}
              style={{ padding: "8px 20px", background: "#0F6E56", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", flex: "1 0 auto" }}
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* ── Preferences panel ── */}
      {settingsOpen && (
        <PreferencesPanel
          draft={draft}
          onToggle={handleToggle}
          onSave={handleSave}
          onClose={closeSettings}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
        />
      )}

      {/* ── Persistent "Cookie Settings" button (after consent given) ── */}
      {hasDecided && (
        <button
          onClick={openSettings}
          aria-label="Open cookie settings"
          style={{
            position:     "fixed",
            bottom:       20,
            right:        20,
            width:        40,
            height:       40,
            borderRadius: "50%",
            background:   "#fff",
            border:       "1px solid #E5E7EB",
            boxShadow:    "0 2px 8px rgba(0,0,0,0.1)",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            zIndex:       9995,
            opacity:      0.7,
            transition:   "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <i className="ti ti-cookie" style={{ fontSize: 18, color: "#0F6E56" }} aria-hidden="true" />
        </button>
      )}
    </>
  );
}
