# KelasTools — alat gratis untuk guru Indonesia

Perangkat kelas yang jalan langsung di browser: **tanpa daftar, tanpa instal, dan tetap
berfungsi saat internet mati**. Dibuat untuk guru SD, SMP, dan SMA yang butuh memilih nama
secara acak, membagi kelompok, atau menjalankan timer ujian di depan kelas.

Situs: <https://kang851216.github.io/kelas-tools/>

## Alat

| Alat | Kegunaan | Buka |
|---|---|---|
| Roda putar nama | Memilih siswa secara acak dengan roda 3D | [roulette.html](https://kang851216.github.io/kelas-tools/roulette.html) |
| Pembagi kelompok | Membagi kelas menjadi 2–10 kelompok, peran otomatis | [kelompok.html](https://kang851216.github.io/kelas-tools/kelompok.html) |
| Timer kelas | Hitung mundur untuk ujian, kuis, atau kerja kelompok | [timer.html](https://kang851216.github.io/kelas-tools/timer.html) |

## Panduan

- [Cara mengundi siswa di kelas](https://kang851216.github.io/kelas-tools/panduan/cara-mengundi-siswa.html)
- [Cara membagi kelompok belajar](https://kang851216.github.io/kelas-tools/panduan/cara-membagi-kelompok-belajar.html)
- [Timer ujian 30 menit](https://kang851216.github.io/kelas-tools/panduan/timer-ujian-30-menit.html)
- [Pembagi kelompok 4 orang](https://kang851216.github.io/kelas-tools/panduan/pembagi-kelompok-4-orang.html)
- [Roda nama offline](https://kang851216.github.io/kelas-tools/panduan/roda-nama-offline.html)
- [Ide ice breaking kelas](https://kang851216.github.io/kelas-tools/panduan/ide-ice-breaking-kelas.html)

## Catatan teknis

- Situs statis murni (HTML, CSS, JS) di GitHub Pages; tidak ada server maupun basis data.
- Nama siswa hanya disimpan di `localStorage` perangkat guru, tidak pernah dikirim ke mana pun.
- Service worker menyimpan aset sehingga alat tetap jalan tanpa koneksi.
- three.js dimuat hanya ketika roda benar-benar dipakai, jadi halaman pertama tetap ringan.
- Penghitung kunjungan bersifat anonim: tanpa cookie, tanpa pengenal, hanya angka.

## Lisensi

MIT.
