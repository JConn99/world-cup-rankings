import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'BTWW 2026 | World Cup Fantasy',
  description: 'World Cup 2026 fantasy scoring tracker for the BTWW group.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <Navigation />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
          BTWW World Cup 2026 &mdash; Updates every 15 minutes
        </footer>
      </body>
    </html>
  );
}
