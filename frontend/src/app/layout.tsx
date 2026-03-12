import '@/app/globals.css';
import type { ReactNode } from 'react';
import Script from 'next/script';
import AppProviders from './providers';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'TecnoMaster',
  description: 'Dashboard TecnoMaster',
  openGraph: { images: ['/assets/imgs/favico.ico'] },
  twitter: { images: ['/assets/imgs/favico.ico'] },
  icons: {
    icon: '/assets/imgs/favico.ico',
    shortcut: '/assets/imgs/favico.ico',
    apple: '/assets/imgs/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
