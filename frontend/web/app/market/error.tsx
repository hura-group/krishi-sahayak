'use client';

import { useEffect } from 'react';

export default function MarketError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  useEffect(() => {
    console.error('[Market Page Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load prices</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message?.includes('supabase')
            ? 'Could not connect to the database. Please check your internet connection.'
            : 'Something went wrong while fetching mandi prices.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
