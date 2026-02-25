import '@/app/globals.css';
import type { ReactNode } from 'react';
import AppProviders from './providers';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Vertecx',
  description: 'Dashboard Vertecx',
  openGraph: { images: ['/assets/imgs/preview.png'] },
  twitter: { images: ['/assets/imgs/preview.png'] },
  icons: {
    icon: '/assets/imgs/preview.png',
    shortcut: '/assets/imgs/favicon.ico',
    apple: '/assets/imgs/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
