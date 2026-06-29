import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Government Schemes for Farmers',
  description:
    'Discover central and state government schemes for Indian farmers — subsidies, insurance, and direct benefit transfers.',
};

// NOTE: placeholder content — no `schemes` table exists in Supabase yet.
const SCHEMES = [
  { name: 'PM-KISAN', body: '₹6,000/year direct income support in three instalments to eligible landholding farmer families.', tag: 'Central Scheme' },
  { name: 'Pradhan Mantri Fasal Bima Yojana', body: 'Crop insurance for yield losses from natural calamities, pests, and disease — premiums as low as 1.5%.', tag: 'Insurance' },
  { name: 'Kisan Credit Card', body: 'Short-term credit up to ₹3 lakh at subsidised rates for crop production and allied activities.', tag: 'Credit' },
  { name: 'PMKSY — Drip Irrigation Subsidy', body: 'Up to 55% subsidy on drip and sprinkler irrigation equipment for small and marginal farmers.', tag: 'Subsidy' },
];

export default function SchemesPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Government Schemes</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Central and state schemes you may be eligible for — subsidies, insurance, and credit.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {SCHEMES.map((s) => (
          <article key={s.name} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>{s.tag}</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '8px 0' }}>{s.name}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{s.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
