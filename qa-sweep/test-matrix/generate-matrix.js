#!/usr/bin/env node
/**
 * generate-matrix.js
 *
 * Generates test-matrix.csv against the REAL screen inventory in
 * hura-group/krishi-sahayak, verified via `find`/`grep` against the actual
 * source tree on 2026-06-28 — not assumed from an earlier exploratory pass.
 *
 * Dark theme and Hindi/Gujarati rows are pre-marked "Blocked" per the
 * evidence in findings/P1-001, P1-002, P1-003.
 *
 * Re-run any time a screen is added/removed:
 *   node generate-matrix.js
 */

const fs = require("fs");
const path = require("path");

const SCREENS = [
  // ── apps/mobile — tab screens ──────────────────────────────────────────────
  { name: "Mobile: Home Tab",          platform: "mobile", category: "Core",     sourceFile: "apps/mobile/app/(tabs)/index.tsx" },
  { name: "Mobile: Explore Tab",       platform: "mobile", category: "Core",     sourceFile: "apps/mobile/app/(tabs)/explore.tsx" },
  { name: "Mobile: Market Tab",        platform: "mobile", category: "Market",   sourceFile: "apps/mobile/app/(tabs)/market.tsx (+ components/MarketFilter)" },
  { name: "Mobile: Map / Mandi Locator Tab", platform: "mobile", category: "Map", sourceFile: "apps/mobile/app/(tabs)/map.tsx (+ components/MandiLocator)" },
  { name: "Mobile: Price Alerts Tab",  platform: "mobile", category: "Alerts",   sourceFile: "apps/mobile/app/(tabs)/alerts.tsx (+ components/PriceAlerts)" },
  { name: "Mobile: Modal",             platform: "mobile", category: "Core",     sourceFile: "apps/mobile/app/modal.tsx" },
  // ── apps/web — routes ──────────────────────────────────────────────────────
  { name: "Web: Home (/)",             platform: "web",    category: "Core",     sourceFile: "apps/web/app/page.tsx" },
  { name: "Web: Market (/market)",     platform: "web",    category: "Market",   sourceFile: "apps/web/app/market/page.tsx" },
  { name: "Web: News (/news)",         platform: "web",    category: "News",     sourceFile: "apps/web/app/news/page.tsx (pending PR #7)" },
  { name: "Web: Schemes (/schemes)",   platform: "web",    category: "Schemes",  sourceFile: "apps/web/app/schemes/page.tsx (pending PR #7)" },
];

const LANGUAGES = ["English", "Hindi", "Gujarati"];
const THEMES    = ["Light", "Dark"];

const BLOCKERS = {
  language: {
    Hindi:    "BLOCKED — see P1-002 (no i18n infrastructure exists yet)",
    Gujarati: "BLOCKED — see P1-002 (no i18n infrastructure exists yet)",
  },
  theme: {
    Dark: "BLOCKED — see P1-001 (dark scaffold exists but unbranded + unused)",
  },
};

function statusFor(language, theme) {
  if (BLOCKERS.language[language]) return BLOCKERS.language[language];
  if (BLOCKERS.theme[theme]) return BLOCKERS.theme[theme];
  return "Not started";
}

const rows = [];
for (const screen of SCREENS) {
  for (const language of LANGUAGES) {
    for (const theme of THEMES) {
      // Dark mode only applies meaningfully to mobile right now (web has no
      // theme toggle at all yet — that's its own gap, tracked separately,
      // but doesn't change today's testable/blocked split for web rows).
      const status = statusFor(language, theme);
      const blocked = status.startsWith("BLOCKED");
      rows.push({
        screen: screen.name,
        platform: screen.platform,
        category: screen.category,
        sourceFile: screen.sourceFile,
        language,
        theme,
        androidStatus: screen.platform === "mobile" ? (blocked ? status : "Not started") : "N/A (web)",
        iosStatus:     screen.platform === "mobile" ? (blocked ? status : "Not started") : "N/A (web)",
        webStatus:     screen.platform === "web"    ? (blocked ? status : "Not started") : "N/A (mobile)",
        p1IssuesFiled: "",
        p2IssuesFiled: "",
      });
    }
  }
}

const HEADER = [
  "Screen", "Platform", "Category", "Source File", "Language", "Theme",
  "Android Status", "iOS Status", "Web Status",
  "P1 Issues Filed", "P2 Issues Filed",
];

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const lines = [HEADER.join(",")];
for (const r of rows) {
  lines.push([
    r.screen, r.platform, r.category, r.sourceFile, r.language, r.theme,
    r.androidStatus, r.iosStatus, r.webStatus, r.p1IssuesFiled, r.p2IssuesFiled,
  ].map(csvEscape).join(","));
}

fs.writeFileSync(path.join(__dirname, "test-matrix.csv"), lines.join("\n") + "\n");

const blockedCount = rows.filter(r =>
  String(r.androidStatus).startsWith("BLOCKED") || String(r.webStatus).startsWith("BLOCKED")
).length;

console.log(`Generated ${rows.length} test rows (${SCREENS.length} screens × ${LANGUAGES.length} languages × ${THEMES.length} themes)`);
console.log(`  → ${rows.length - blockedCount} immediately testable`);
console.log(`  → ${blockedCount} blocked pending infrastructure (see findings/P1-001, P1-002)`);
