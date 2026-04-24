import type { Metadata } from 'next';
import {
  fetchMarketPrices,
  fetchUniqueCommodities,
  fetchUniqueStates,
} from '@/lib/supabase-server';
import MarketTable from './MarketTable';
import StatsBar    from './StatsBar';

// ── ISR: rebuild page every 60 seconds ───────────────────────
export const revalidate = 60;

// ── Dynamic SEO metadata ─────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const commodities = await fetchUniqueCommodities();
  const cropList    = commodities.slice(0, 8).join(', ');
  const today       = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return {
    title:       `Mandi Prices Today | ${cropList} | KrishiSahayak`,
    description: `Live mandi commodity prices for ${cropList} and more across all Indian states. ` +
                 `Updated every 60 seconds. Compare prices vs MSP. Free CSV export for farmers and traders. As of ${today}.`,
    keywords:    [
      ...commodities.map(c => `${c} mandi price today`),
      ...commodities.map(c => `${c} rate per quintal`),
      'today mandi bhav', 'APMC price list', 'agriculture commodity prices India',
      'kisan mandi rate', 'crop price MSP comparison', 'agri market prices',
    ],
    openGraph: {
      title:       `Today's Mandi Prices — ${cropList}`,
      description: `Live commodity prices across Indian mandis. Compare vs MSP. Export to CSV.`,
      type:        'website',
      locale:      'en_IN',
      siteName:    'KrishiSahayak',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `Today's Mandi Prices — ${cropList}`,
      description: `Live mandi rates. Updated every 60s.`,
    },
    alternates: {
      canonical: 'https://krishisahayak.app/market',
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1 },
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────

export default async function MarketPage() {
  const [rows, commodities, states] = await Promise.all([
    fetchMarketPrices(),
    fetchUniqueCommodities(),
    fetchUniqueStates(),
  ]);

  const fetchedAt    = new Date().toISOString();
  const belowMSPRows = rows.filter(r => r.trend === 'below');

  // ── JSON-LD structured data for Google ───────────────────────
  const structuredData = {
    '@context':   'https://schema.org',
    '@type':      'Dataset',
    name:         'KrishiSahayak Mandi Price Index',
    description:  'Live agricultural commodity prices from Indian mandis (APMC markets)',
    url:          'https://krishisahayak.app/market',
    keywords:     commodities.join(', '),
    creator: {
      '@type': 'Organization',
      name:    'KrishiSahayak',
      url:     'https://krishisahayak.app',
    },
    temporalCoverage: new Date().toISOString().split('T')[0],
    spatialCoverage: {
      '@type': 'Country',
      name:    'India',
    },
    distribution: {
      '@type':           'DataDownload',
      encodingFormat:    'text/csv',
      name:              'Mandi prices CSV export',
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gray-50">

        {/* ── Nav bar ──────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg hover:opacity-80 transition-opacity">
              <span className="text-2xl">🌾</span>
              <span>Krishi<span className="text-green-600">Sahayak</span></span>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/"        className="hover:text-green-600 transition-colors">Home</a>
              <a href="/market"  className="text-green-600 font-semibold border-b-2 border-green-600 pb-0.5">Market</a>
              <a href="/about"   className="hover:text-green-600 transition-colors">About</a>
            </nav>
            <a
              href="https://apps.apple.com"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              📱 Get App
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 w-fit mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live · Refreshes every 60 seconds
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
              Today's Mandi Prices
            </h1>
            <p className="text-gray-500 text-base max-w-2xl">
              Real-time commodity prices from APMC markets across India.
              Compare against MSP, filter by crop or state, and export to CSV for free.
            </p>
          </div>

          {/* ── Below MSP alert banner ──────────────────────────── */}
          {belowMSPRows.length > 0 && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold text-red-700 text-sm">
                  {belowMSPRows.length} price{belowMSPRows.length > 1 ? 's' : ''} currently below MSP
                </p>
                <p className="text-red-600 text-xs mt-0.5">
                  {[...new Set(belowMSPRows.map(r => r.crop_name))].slice(0, 5).join(', ')}{' '}
                  — farmers may consider holding stock or checking other mandis.
                </p>
              </div>
            </div>
          )}

          {/* ── Stats strip ──────────────────────────────────────── */}
          <StatsBar rows={rows} />

          {/* ── Main table card ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Price Table</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click any column header to sort · Use filters to narrow down
                </p>
              </div>
              <span className="hidden sm:block text-xs text-gray-400">
                ISR · {new Date(fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <MarketTable
              rows={rows}
              commodities={commodities}
              states={states}
              fetchedAt={fetchedAt}
            />
          </div>

          {/* ── SEO commodity grid ───────────────────────────────── */}
          <section className="mt-12" aria-label="Commodity price guides">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Today's Rates by Commodity
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {commodities.map(crop => {
                const cropRows = rows.filter(r => r.crop_name === crop);
                if (!cropRows.length) return null;
                const avg = Math.round(cropRows.reduce((s, r) => s + r.price_per_qtl, 0) / cropRows.length);
                const max = Math.max(...cropRows.map(r => r.price_per_qtl));
                const min = Math.min(...cropRows.map(r => r.price_per_qtl));
                return (
                  <div
                    key={crop}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{CROP_EMOJI[crop] ?? '🌿'}</span>
                      <h3 className="font-semibold text-gray-900 text-sm">{crop}</h3>
                    </div>
                    <p className="text-lg font-bold text-green-700 tabular-nums">
                      ₹{avg.toLocaleString('en-IN')}
                      <span className="text-xs text-gray-400 font-normal">/qtl avg</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 tabular-nums">
                      ₹{min.toLocaleString('en-IN')} – ₹{max.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400">{cropRows.length} mandi{cropRows.length > 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── FAQ for SEO ──────────────────────────────────────── */}
          <section className="mt-12 max-w-3xl" aria-label="FAQ">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'How often are mandi prices updated?',
                  a: 'Prices are refreshed automatically every 60 seconds using server-side incremental static regeneration. The "Live" badge at the top of the page confirms data freshness.',
                },
                {
                  q: 'What is MSP and why does it matter?',
                  a: 'The Minimum Support Price (MSP) is set by the Government of India to protect farmers from price crashes. When a commodity trades below its MSP, it\'s highlighted in red — farmers in those regions may want to delay selling or reach out to local procurement agencies.',
                },
                {
                  q: 'How do I export prices to Excel?',
                  a: 'Click the "Export CSV" button at the top-right of the table. The file opens directly in Microsoft Excel, Google Sheets, or any spreadsheet app. Your current filters are applied — so you can export just one state or one commodity.',
                },
                {
                  q: 'Which states and mandis are covered?',
                  a: `We currently cover APMC markets in ${states.slice(0, 5).join(', ')}${states.length > 5 ? ` and ${states.length - 5} more states` : ''}. Coverage expands continuously as our data partners add more markets.`,
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
                >
                  <summary className="flex justify-between items-center cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                    {q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-4">⌄</span>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

        </main>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-gray-200 mt-16 py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} KrishiSahayak · Built for Indian farmers</p>
            <p>Data sourced from APMC market records · Not financial advice</p>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
              <a href="/terms"   className="hover:text-gray-600 transition-colors">Terms</a>
              <a href="/api/market-prices" className="hover:text-gray-600 transition-colors">API</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Moved outside component to avoid re-definition
const CROP_EMOJI: Record<string, string> = {
  Wheat: '🌾', Rice: '🌾', Cotton: '🌿', Groundnut: '🥜', Soybean: '🫘',
  Maize: '🌽', Onion: '🧅', Potato: '🥔', Tomato: '🍅', Sugarcane: '🎋',
  Bajra: '🌾', Jowar: '🌾', Mustard: '🌻', 'Tur Dal': '🫘', Gram: '🫘',
};
