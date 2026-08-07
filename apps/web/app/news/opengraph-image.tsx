import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: '#fff', fontFamily: 'sans-serif' }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, opacity: 0.85, textTransform: 'uppercase', marginBottom: 16 }}>
          Agriculture News
        </span>
        <span style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.15, maxWidth: 900 }}>
          What&apos;s happening this season
        </span>
        <span style={{ fontSize: 26, opacity: 0.85, marginTop: 16, maxWidth: 800 }}>
          Weather advisories, policy changes, and farming techniques.
        </span>
      </div>
    ),
    { ...size }
  );
}
