# Pemeriksaan pemutar

Perbaikan mencakup batas waktu sumber TV (12 detik), mulai memutar TV (12 detik), dan siaran yang berhenti bergerak (10 detik). Kegagalan eksplisit segera mencoba sumber cadangan; setelah sumber gagal, halaman menampilkan alasannya dan memilih channel berikutnya setelah 0,8 detik. Setiap channel yang sudah gagal dilewati sampai pengguna mencoba lagi. Jika daftar habis, perpindahan berhenti dengan pesan.

Koneksi pengguna yang putus, autoplay yang memerlukan klik, dan browser/DRM yang tidak didukung tidak dianggap sebagai channel offline. Pemutar eksternal dalam iframe hanya menyediakan status pemuatan halaman; status video di dalamnya tidak bisa diperiksa oleh aplikasi karena pembatasan antar-domain browser.

Proxy mempertahankan HTTP Range, menulis ulang URI playlist HLS (termasuk audio, init, key, dan part), serta memberi pemutar DASH alamat akhir manifest setelah redirect. TLS tetap diverifikasi. Koneksi yang macet diberi batas waktu tanpa membatasi durasi total film yang masih mengirim data.

## Menjalankan pemeriksaan

```sh
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tes browser memakai build produksi terbaru pada port 3100. Pastikan port tersebut tidak dipakai server development. Untuk memakai Microsoft Edge yang sudah terpasang di Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Tes memakai video WebM sintetis lokal di `tests/fixtures/playback.webm`, sehingga kegagalan penyedia eksternal tidak membuat tes regresi berubah-ubah. Kasus yang diuji meliputi perpindahan TV, semua channel offline, daftar channel terlambat, timeout sumber/pemutar, autoplay ditolak, koneksi offline, sumber cadangan, perubahan kecepatan, retry, dan localStorage diblokir. Tes unit mencakup normalisasi sumber, subtitle, timeout pembacaan respons, penulisan ulang playlist, redirect, dan HTTP Range.

Pemeriksaan langsung tambahan berhasil mengambil 13 sumber dan 60 channel Indonesia. GTV berhasil diputar di Microsoft Edge; playlist iNews dapat diakses. Sumber Indosiar mengembalikan kegagalan akses. Ini merupakan sampel kondisi saat pemeriksaan, bukan jaminan seluruh penyedia selalu tersedia.

Konfigurasi server mendukung `CINEFLOW_BASE_URL`, `CINEFLOW_REFRESH_TOKEN`, dan `CINEFLOW_INSTANCE_ID`. Override minimatch hanya berlaku untuk dependensi pengembangan typescript-eslint agar perbaikan advisori tersedia tanpa menurunkan versi Next.js.
