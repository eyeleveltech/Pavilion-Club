import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { PwaInstallPrompt } from '@/components/public/PwaInstallPrompt';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B192C',
};

export const metadata: Metadata = {
  title: 'The Pavilion Club — Pickleball Arena',
  description: 'Premier indoor pickleball arena in Adyar, Chennai. 3 championship regulation pickleball courts, glare-free LED lighting.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pavilion Club',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-bg text-ink min-h-screen">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
