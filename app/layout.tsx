import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ebola IPC Assessment Analysis Dashboard',
  description:
    'Client-side analysis and visualization of WHO IPC Rapid Assessment Tool (RAT) results. Data never leaves your browser.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
