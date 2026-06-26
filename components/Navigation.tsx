'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',       label: 'Rankings'  },
  { href: '/stats',  label: 'Stats'     },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            BTWW <span className="text-emerald-400">2026</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
