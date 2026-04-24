import { MarketRow } from '@/lib/supabase-server';

interface Props {
  rows: MarketRow[];
}

export default function StatsBar({ rows }: Props) {
  const belowMSP   = rows.filter(r => r.trend === 'below').length;
  const aboveMSP   = rows.filter(r => r.trend === 'above').length;
  const states     = new Set(rows.map(r => r.state)).size;
  const commodities = new Set(rows.map(r => r.crop_name)).size;

  const avgPrice = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.price_per_qtl, 0) / rows.length)
    : 0;

  const stats = [
    { icon: '📊', label: 'Total Records',    value: rows.length.toLocaleString('en-IN') },
    { icon: '🌾', label: 'Commodities',      value: commodities },
    { icon: '📍', label: 'States',           value: states },
    { icon: '💰', label: 'Avg Price/qtl',    value: `₹${avgPrice.toLocaleString('en-IN')}` },
    { icon: '▲',  label: 'Above MSP',        value: aboveMSP,  color: 'text-emerald-600' },
    { icon: '▼',  label: 'Below MSP',        value: belowMSP,  color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {stats.map(s => (
        <div
          key={s.label}
          className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex flex-col gap-0.5"
        >
          <span className="text-lg">{s.icon}</span>
          <span className={`text-xl font-bold text-gray-900 tabular-nums ${s.color ?? ''}`}>
            {s.value}
          </span>
          <span className="text-xs text-gray-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
