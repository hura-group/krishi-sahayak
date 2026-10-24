/**
 * src/components/legal/LegalPageLayout.jsx
 *
 * Shared layout for /privacy and /terms pages.
 *
 * Features:
 *  - Sticky table of contents (desktop sidebar)
 *  - Active section highlighting as you scroll
 *  - Markdown-lite rendering (bold via **text**, line breaks)
 *  - Print-friendly styles
 *  - "Last updated" badge + version chip
 *  - Accessible: landmark nav, skip link, proper heading hierarchy
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

/**
 * Renders **bold** and newlines within a string as React nodes.
 * Intentionally minimal — these are legal documents, not blog posts.
 */
function renderBody(text) {
  if (!text) return null;

  return text.split("\n\n").map((paragraph, pi) => {
    if (!paragraph.trim()) return null;

    // Split on **bold** markers
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Detect if this paragraph is a list item (starts with "- ")
    if (paragraph.trimStart().startsWith("- ")) {
      const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul key={pi} style={{ margin: "6px 0 12px 20px", padding: 0 }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ marginBottom: 4, lineHeight: 1.7, color: "#374151" }}>
              {item.replace(/^- /, "")}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={pi} style={{ margin: "0 0 14px", lineHeight: 1.8, color: "#374151" }}>
        {parts}
      </p>
    );
  });
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ sections, activeId }) {
  return (
    <nav aria-label="Table of contents" style={{ position: "sticky", top: 80 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>
        Contents
      </p>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              style={{
                display:      "block",
                padding:      "5px 8px",
                fontSize:     13,
                lineHeight:   1.4,
                color:        activeId === s.id ? "#0F6E56" : "#6B7280",
                fontWeight:   activeId === s.id ? 600 : 400,
                textDecoration: "none",
                borderLeft:   `2px solid ${activeId === s.id ? "#0F6E56" : "transparent"}`,
                borderRadius: "0 4px 4px 0",
                background:   activeId === s.id ? "#F0FDF4" : "transparent",
                transition:   "all 0.15s",
              }}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   content: {
 *     title:         string,
 *     lastUpdated:   string,
 *     effectiveDate: string,
 *     version:       string,
 *     intro:         string,
 *     sections:      { id: string, title: string, body: string }[],
 *   }
 * }} props
 */
export default function LegalPageLayout({ content }) {
  const [activeId, setActiveId] = useState(content.sections[0]?.id ?? "");
  const observerRef = useRef(null);

  // Highlight active section based on scroll position
  useEffect(() => {
    const headings = document.querySelectorAll("[data-section-id]");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.dataset.sectionId);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)", background: "#FAFAFA", minHeight: "100vh" }}>

      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        style={{ position: "absolute", left: "-9999px", top: 0, zIndex: 9999 }}
        onFocus={(e) => { e.currentTarget.style.left = "16px"; }}
        onBlur={(e)  => { e.currentTarget.style.left = "-9999px"; }}
      >
        Skip to main content
      </a>

      {/* ── Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <i className="ti ti-plant-2" style={{ fontSize: 20, color: "#0F6E56" }} aria-hidden="true" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>KisanSathi</span>
        </Link>
        <span aria-hidden="true" style={{ color: "#D1D5DB" }}>·</span>
        <span style={{ fontSize: 14, color: "#6B7280" }}>{content.title}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "2px 8px", borderRadius: 10, color: "#6B7280" }}>
            v{content.version}
          </span>
          <Link
            href={content.title.toLowerCase().includes("privacy") ? "/terms" : "/privacy"}
            style={{ fontSize: 12, color: "#0F6E56", textDecoration: "none", fontWeight: 500 }}
          >
            {content.title.toLowerCase().includes("privacy") ? "Terms →" : "Privacy →"}
          </Link>
        </div>
      </header>

      {/* ── Body layout ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, alignItems: "start" }} className="legal-grid">

        {/* Sidebar TOC (hidden on mobile via print/CSS) */}
        <aside style={{ display: "none" }} id="toc-sidebar">
          <TableOfContents sections={content.sections} activeId={activeId} />
        </aside>

        {/* Main content */}
        <main id="main-content" role="main">

          {/* Page title */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>
              {content.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                <i className="ti ti-calendar" style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
                Last updated: <strong>{content.lastUpdated}</strong>
              </span>
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                <i className="ti ti-checks" style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
                Effective: <strong>{content.effectiveDate}</strong>
              </span>
            </div>
          </div>

          {/* Intro */}
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "16px 20px", marginBottom: 32 }}>
            {content.intro.split("\n\n").map((p, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0", fontSize: 14, lineHeight: 1.7, color: "#065F46" }}>{p}</p>
            ))}
          </div>

          {/* Sections */}
          {content.sections.map((section) => (
            <section key={section.id} id={section.id} data-section-id={section.id} style={{ marginBottom: 40, scrollMarginTop: 90 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: "0 0 14px", paddingBottom: 8, borderBottom: "1px solid #F3F4F6" }}>
                {section.title}
              </h2>
              <div style={{ fontSize: 14 }}>{renderBody(section.body)}</div>
            </section>
          ))}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 24, marginTop: 16, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>
              © {new Date().getFullYear()} KisanSathi Technologies Pvt. Ltd. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <Link href="/privacy" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Privacy Policy</Link>
              <Link href="/terms" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Terms of Service</Link>
              <button
                onClick={() => document.dispatchEvent(new CustomEvent("open-cookie-settings"))}
                style={{ fontSize: 12, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Responsive + print styles */}
      <style>{`
        @media (min-width: 768px) {
          #toc-sidebar { display: block !important; }
          .legal-grid { grid-template-columns: 220px 1fr !important; }
        }
        @media (max-width: 767px) {
          .legal-grid { grid-template-columns: 1fr !important; padding: 24px 16px !important; gap: 0 !important; }
        }
        @media print {
          header, #toc-sidebar { display: none !important; }
          .legal-grid { grid-template-columns: 1fr !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
