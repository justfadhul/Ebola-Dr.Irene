import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'Ebola IPC Assessment Analysis Dashboard',
  description:
    'Client-side analysis and visualization of WHO IPC Rapid Assessment Tool (RAT) results. Data never leaves your browser.',
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IPC Dashboard',
  },
  icons: {
    icon: [
      { url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
