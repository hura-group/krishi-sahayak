/**
 * src/features/Settings/components/LegalLinks.jsx
 *
 * Legal links section for the app Settings screen.
 * Shows Privacy Policy, Terms of Service, Cookie Settings,
 * and Data & Privacy (DPDP / GDPR self-service).
 *
 * Usage:
 *   <LegalLinks />
 *
 * Works in both React web (Next.js Link) and React Native
 * (swap Link for Pressable + Linking.openURL).
 */

import React from "react";
import Link  from "next/link";

const POLICY_LAST_UPDATED = "19 May 2026";

const LINKS = [
  {
    id:          "privacy",
    href:        "/privacy",
    icon:        "ti-shield-lock",
    label:       "Privacy Policy",
    description: "How we collect, use, and protect your data",
    external:    false,
  },
  {
    id:          "terms",
    href:        "/terms",
    icon:        "ti-file-text",
    label:       "Terms of Service",
    description: "Platform rules, marketplace policies, and your rights",
    external:    false,
  },
  {
    id:          "cookie-settings",
    href:        null, // handled by onClick
    icon:        "ti-cookie",
    label:       "Cookie Settings",
    description: "Manage your analytics and marketing preferences",
    external:    false,
    onClick:     () => document.dispatchEvent(new CustomEvent("open-cookie-settings")),
  },
  {
    id:          "data-privacy",
    href:        "/settings/data-privacy",
    icon:        "ti-database",
    label:       "Data & Privacy",
    description: "Download, correct, or delete your personal data",
    external:    false,
  },
  {
    id:          "grievance",
    href:        "https://kisansathi.in/grievance",
    icon:        "ti-message-report",
    label:       "Privacy Grievance",
    description: "Raise a concern with our Data Protection Officer",
    external:    true,
  },
];

function SettingsRow({ link }) {
  const inner = (
    <div
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         12,
        padding:     "13px 16px",
        background:  "#fff",
        borderBottom:"0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.07))",
        cursor:      "pointer",
        transition:  "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
    >
      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width:          36,
          height:         36,
          borderRadius:   10,
          background:     "#F0FDF4",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}
      >
        <i className={link.icon} style={{ fontSize: 17, color: "#0F6E56" }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{link.label}</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{link.description}</div>
      </div>

      {/* Chevron or external icon */}
      <i
        className={link.external ? "ti ti-external-link" : "ti ti-chevron-right"}
        style={{ fontSize: 15, color: "#9CA3AF", flexShrink: 0 }}
        aria-hidden="true"
      />
    </div>
  );

  if (link.onClick) {
    return <div role="button" tabIndex={0} onClick={link.onClick} onKeyDown={(e) => e.key === "Enter" && link.onClick()}>{inner}</div>;
  }

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={link.href} style={{ textDecoration: "none", display: "block" }}>
      {inner}
    </Link>
  );
}

export default function LegalLinks() {
  return (
    <section aria-labelledby="legal-settings-heading" style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* Section header */}
      <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2
          id="legal-settings-heading"
          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          Legal & Privacy
        </h2>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Updated {POLICY_LAST_UPDATED}</span>
      </div>

      {/* Links */}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.07))", margin: "0 12px" }}>
        {LINKS.map((link) => (
          <SettingsRow key={link.id} link={link} />
        ))}
      </div>

      {/* Footer note */}
      <p style={{ margin: "10px 16px 0", fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
        Under India's DPDP Act 2023, you have the right to access, correct, or delete your personal data. Contact{" "}
        <a href="mailto:dpo@kisansathi.in" style={{ color: "#0F6E56" }}>dpo@kisansathi.in</a> for any privacy requests.
      </p>
    </section>
  );
}


// =============================================================================
// LegalConsent — onboarding consent checkbox
// =============================================================================

/**
 * src/features/Onboarding/components/LegalConsent.jsx
 *
 * Consent checkbox shown on the final step of the onboarding flow.
 *
 * The user must check this before they can proceed. The checkbox records:
 *   - Acceptance of Terms of Service
 *   - Acknowledgement of Privacy Policy
 *   - Opt-in/out to marketing communications
 *
 * Usage:
 *   const [legalAccepted, setLegalAccepted] = useState(false);
 *   const [marketingOptIn, setMarketingOptIn] = useState(false);
 *
 *   <LegalConsent
 *     legalAccepted={legalAccepted}
 *     onLegalChange={setLegalAccepted}
 *     marketingOptIn={marketingOptIn}
 *     onMarketingChange={setMarketingOptIn}
 *   />
 *   <button disabled={!legalAccepted}>Create Account</button>
 */

export function LegalConsent({
  legalAccepted,
  onLegalChange,
  marketingOptIn,
  onMarketingChange,
}) {
  return (
    <div
      style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}
      role="group"
      aria-label="Legal agreements"
    >
      {/* ── Required: ToS + Privacy ── */}
      <label
        style={{
          display:     "flex",
          alignItems:  "flex-start",
          gap:         12,
          padding:     "14px",
          background:  legalAccepted ? "#F0FDF4" : "#FAFAFA",
          border:      `1px solid ${legalAccepted ? "#BBF7D0" : "#E5E7EB"}`,
          borderRadius:12,
          cursor:      "pointer",
          marginBottom:10,
          transition:  "all 0.15s",
        }}
      >
        <input
          type="checkbox"
          checked={legalAccepted}
          onChange={(e) => onLegalChange(e.target.checked)}
          required
          aria-required="true"
          style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0F6E56", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
          I have read and agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#0F6E56", fontWeight: 500 }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0F6E56", fontWeight: 500 }}>
            Privacy Policy
          </Link>
          . I understand that KisanSathi will process my personal and farm data as described.{" "}
          <span style={{ color: "#EF4444", fontWeight: 600 }}>*</span>
        </span>
      </label>

      {/* ── Optional: Marketing opt-in ── */}
      <label
        style={{
          display:    "flex",
          alignItems: "flex-start",
          gap:        12,
          padding:    "12px 14px",
          background: "#FAFAFA",
          border:     "1px solid #E5E7EB",
          borderRadius:12,
          cursor:     "pointer",
          transition: "all 0.15s",
        }}
      >
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => onMarketingChange(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0F6E56", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
          Send me weekly market price summaries, crop tips, and platform updates via SMS, WhatsApp, and email.{" "}
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>(Optional — you can change this anytime in Settings)</span>
        </span>
      </label>

      {/* Required field note */}
      {!legalAccepted && (
        <p style={{ margin: "6px 0 0 2px", fontSize: 11, color: "#9CA3AF" }}>
          <span style={{ color: "#EF4444" }}>*</span> You must accept the Terms and Privacy Policy to create an account.
        </p>
      )}
    </div>
  );
}
