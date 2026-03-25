import '@/app/globals.css';
import type { ReactNode } from 'react';
import Script from 'next/script';
import AppProviders from './providers';

function resolveMetadataBase() {
  const publicUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!publicUrl) {
    return undefined;
  }

  try {
    return new URL(publicUrl);
  } catch {
    return undefined;
  }
}

export const metadata = {
  metadataBase: resolveMetadataBase(),
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
