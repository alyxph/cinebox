'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Search } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090a0f]/95 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">

        {/* Brand Logo (Klik untuk kembali ke Beranda) */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0 sm:w-40" title="CineBox - Beranda">
          <div className="w-8 h-8 rounded-lg bg-[#e50914] flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline text-lg font-bold tracking-tight text-white">
            CINE<span className="text-[#e50914]">BOX</span>
          </span>
        </Link>

        {/* Search Bar (YouTube style, centered) */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex justify-center">
          <div className="flex w-full max-w-2xl h-10 rounded-full border border-white/10 bg-[#131622] focus-within:border-white/30 overflow-hidden transition-colors duration-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari film / serial..."
              aria-label="Cari film / serial"
              className="flex-1 min-w-0 bg-transparent px-5 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="flex items-center justify-center w-14 sm:w-16 shrink-0 border-l border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Spacer with same width as logo to keep search perfectly centered */}
        <div className="hidden sm:block shrink-0 w-40" aria-hidden="true" />
      </div>
    </header>
  );
}
