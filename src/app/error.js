'use client';

import Link from 'next/link';

export default function ErrorPage({ retry }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#090a0f] p-6 text-center text-white">
      <h1 className="text-xl font-bold">Halaman gagal dimuat</h1>
      <p className="text-sm text-gray-400">Terjadi gangguan. Coba muat ulang halaman untuk melanjutkan.</p>
      <button onClick={() => retry()} className="rounded-xl bg-[#e50914] px-5 py-3">Coba Lagi</button>
      <Link href="/" className="text-sm underline">Kembali ke Beranda</Link>
    </main>
  );
}
