import { NextResponse } from 'next/server';
import { fetchMarketPrices } from '@/lib/supabase-server';

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state    = searchParams.get('state')    ?? undefined;
  const crop     = searchParams.get('crop')     ?? undefined;
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);

  try {
    let rows = await fetchMarketPrices(state);
    if (crop) rows = rows.filter(r => r.crop_name.toLowerCase() === crop.toLowerCase());

    return NextResponse.json(
      {
        success:    true,
        count:      rows.slice(0, limit).length,
        total:      rows.length,
        fetched_at: new Date().toISOString(),
        data:       rows.slice(0, limit),
      },
      {
        headers: {
          'Cache-Control':                 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin':   '*',
          'Access-Control-Allow-Methods':  'GET',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
