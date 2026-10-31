import type { Metadata } from 'next';
import { Inter_Tight, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const interTight = Inter_Tight({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Murmur — Voice-First Task Manager',
  description: 'Fast, calm, voice-controlled task manager for focused minds.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${instrumentSerif.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg-app)] text-[var(--text-primary)] antialiased select-none">
        <div className="ambient-bg" />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
