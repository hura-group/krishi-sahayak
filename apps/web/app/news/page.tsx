import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agriculture News',
  description:
    'Latest news on monsoon forecasts, crop advisories, government policy changes, and farming techniques — curated for Indian farmers.',
};

// NOTE: placeholder content — no `news` table exists in Supabase yet.
// Structured the same way as app/market/page.tsx so swapping in a real
// fetchNews() from lib/supabase-server.ts later is a small diff, not a rewrite.
const ARTICLES = [
  {
    title: 'IMD predicts above-normal monsoon for Kharif season',
    summary: 'The India Meteorological Department forecasts 106% of the long-period average rainfall this season.',
    category: 'Weather',
    date: '18 Jun 2026',
  },
  {
    title: 'MSP for wheat raised by ₹150 per quintal',
    summary: 'The Cabinet Committee on Economic Affairs approved a hike in minimum support price ahead of the Rabi season.',
    category: 'Policy',
    date: '16 Jun 2026',
  },
  {
    title: 'New drip irrigation subsidy opens for applications',
    summary: 'Farmers in water-stressed districts can claim up to 55% subsidy under the revised PMKSY scheme.',
    category: 'Schemes',
    date: '14 Jun 2026',
  },
];

export default function NewsPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Agriculture News</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Weather advisories, policy changes, and farming techniques — curated for Indian farmers.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {ARTICLES.map((a) => (
          <article key={a.title} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              <span>{a.category}</span><span>·</span><span style={{ color: '#888' }}>{a.date}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{a.title}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{a.summary}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
