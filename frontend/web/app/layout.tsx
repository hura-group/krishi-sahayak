import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor:   '#16a34a',
  width:        'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://krishisahayak.app'),
  title: {
    default:  'KrishiSahayak — Smart Farming for India',
    template: '%s | KrishiSahayak',
  },
  description:
    'KrishiSahayak helps Indian farmers track mandi prices, set price alerts, and find nearby APMC markets. Live commodity prices for Wheat, Rice, Cotton, Groundnut, Onion and more.',
  keywords:     ['mandi price', 'kisan app', 'agriculture india', 'apmc market', 'crop price today', 'krishi', 'farmer app'],
  authors:      [{ name: 'KrishiSahayak', url: 'https://krishisahayak.app' }],
  openGraph: {
    type:      'website',
    locale:    'en_IN',
    url:       'https://krishisahayak.app',
    siteName:  'KrishiSahayak',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
