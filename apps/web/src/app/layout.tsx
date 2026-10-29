import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { PwaInstallPrompt } from '@/components/public/PwaInstallPrompt';
import { RouteTransitionGuard } from '@/components/public/RouteTransitionGuard';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B192C',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://thepavilionclub.com'),
  title: {
    default: 'The Pavilion Club · Pickleball Arena, Mogappair East, Chennai',
    template: '%s | The Pavilion Club',
  },
  description: 'Premier indoor pickleball arena in Mogappair East, Chennai. 3 championship regulation pickleball courts, glare-free LED lighting.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pavilion Club',
  },
  openGraph: {
    title: 'The Pavilion Club · Pickleball Arena, Mogappair East, Chennai',
    description: 'Premier indoor pickleball arena in Mogappair East, Chennai. 3 championship regulation pickleball courts, glare-free LED lighting.',
    url: 'https://thepavilionclub.com',
    siteName: 'The Pavilion Club',
    images: [
      {
        url: '/assets/images/courts-hall.png',
        width: 1200,
        height: 630,
        alt: 'The Pavilion Club Championship Pickleball Courts',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Pavilion Club · Pickleball Arena, Mogappair East, Chennai',
    description: 'Premier indoor pickleball arena in Mogappair East, Chennai. 3 championship regulation pickleball courts, glare-free LED lighting.',
    images: ['/assets/images/courts-hall.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
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
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <body className="font-sans antialiased bg-bg text-ink min-h-screen" suppressHydrationWarning>
        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WHX25XHF');`,
          }}
        />
        {children}
        <PwaInstallPrompt />
        <RouteTransitionGuard />
      </body>
    </html>
  );
}
