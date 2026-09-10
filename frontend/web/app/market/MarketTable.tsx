'use client';

import { useCallback, useMemo, useState } from 'react';
import { MarketRow } from '@/lib/supabase-server';

// ─── Types ────────────────────────────────────────────────────

type SortKey   = 'crop_name' | 'state' | 'price_per_qtl' | 'vs_msp_pct' | 'price_date';
type SortDir   = 'asc' | 'desc';

interface Props {
  rows:         MarketRow[];
  commodities:  string[];
  states:       string[];
  fetchedAt:    string;
}

// ─── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN');

function trendBadge(trend: MarketRow['trend'], pct: number | null) {
  if (trend === null || pct === null) return null;
  const cfg = {
    above: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: '▲', label: `+${pct}%` },
    below: { bg: 'bg-red-50 text-red-600 ring-red-200',             icon: '▼', label: `${pct}%` },
    near:  { bg: 'bg-amber-50 text-amber-700 ring-amber-200',       icon: '─', label: `${pct}%` },
  }[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ${cfg.bg}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function exportCSV(rows: MarketRow[]) {
  const header = ['Commodity', 'State', 'Price (₹/qtl)', 'MSP (₹/qtl)', 'vs MSP %', 'Date'];
  const csvRows = rows.map(r => [
    r.crop_name,
    r.state,
    r.price_per_qtl,
    r.msp_per_qtl ?? '',
    r.vs_msp_pct  ?? '',
    new Date(r.price_date).toLocaleDateString('en-IN'),
  ]);
  const csv = [header, ...csvRows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `krishi-mandi-prices-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CROP_EMOJI: Record<string, string> = {
  Wheat: '🌾', Rice: '🌾', Cotton: '🌿', Groundnut: '🥜', Soybean: '🫘',
  Maize: '🌽', Onion: '🧅', Potato: '🥔', Tomato: '🍅', Sugarcane: '🎋',
  Bajra: '🌾', Jowar: '🌾', Mustard: '🌻', 'Tur Dal': '🫘', Gram: '🫘',
};

// ─── Component ────────────────────────────────────────────────

export default function MarketTable({ rows, commodities, states, fetchedAt }: Props) {
  const [search,    setSearch]    = useState('');
  const [cropFilter,setCropFilter]= useState('');
  const [stateFilter,setStateFilter] = useState('');
  const [sortKey,   setSortKey]   = useState<SortKey>('price_date');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 20;

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search)      r = r.filter(x =>
      x.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      x.state.toLowerCase().includes(search.toLowerCase())
    );
    if (cropFilter)  r = r.filter(x => x.crop_name === cropFilter);
    if (stateFilter) r = r.filter(x => x.state === stateFilter);
    return r;
  }, [rows, search, cropFilter, stateFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1  : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages  = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span className="ml-1 text-green-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 text-gray-300">↕</span>;

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => handleSort(key)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-50 whitespace-nowrap transition-colors"
    >
      {label}<SortIcon k={key} />
    </th>
  );

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search crop or state…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-52"
            />
          </div>

          {/* Crop filter */}
          <select
            value={cropFilter}
            onChange={e => { setCropFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All Commodities</option>
            {commodities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* State filter */}
          <select
            value={stateFilter}
            onChange={e => { setStateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Clear */}
          {(search || cropFilter || stateFilter) && (
            <button
              onClick={() => { setSearch(''); setCropFilter(''); setStateFilter(''); setPage(1); }}
              className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Right: count + CSV */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {sorted.length.toLocaleString()} record{sorted.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => exportCSV(sorted)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg transition-colors shadow-sm"
          >
            <span>⬇</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              {th('Commodity',  'crop_name')}
              {th('State',      'state')}
              {th('Price/qtl',  'price_per_qtl')}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                MSP/qtl
              </th>
              {th('vs MSP',     'vs_msp_pct')}
              {th('Date',       'price_date')}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                  <div className="text-3xl mb-2">🌾</div>
                  No prices match your filters
                </td>
              </tr>
            ) : paginated.map((row, i) => (
              <tr
                key={row.id}
                className={`hover:bg-green-50/40 transition-colors ${
                  row.trend === 'below' ? 'bg-red-50/20' : ''
                }`}
              >
                {/* Commodity */}
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  <span className="mr-2">{CROP_EMOJI[row.crop_name] ?? '🌿'}</span>
                  {row.crop_name}
                </td>

                {/* State */}
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {row.state}
                </td>

                {/* Price */}
                <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap tabular-nums">
                  {fmt(row.price_per_qtl)}
                </td>

                {/* MSP */}
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">
                  {row.msp_per_qtl ? fmt(row.msp_per_qtl) : <span className="text-gray-300">—</span>}
                </td>

                {/* vs MSP badge */}
                <td className="px-4 py-3">
                  {trendBadge(row.trend, row.vs_msp_pct)}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {new Date(row.price_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >«</button>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    p === page
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >{p}</button>
              );
            })}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >›</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >»</button>
          </div>
        </div>
      )}

      {/* ── Footer: last updated ─────────────────────────────── */}
      <p className="text-xs text-gray-400 text-right">
        Prices fetched {new Date(fetchedAt).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })} · Auto-refreshes every 60 s
      </p>
    </div>
  );
}
