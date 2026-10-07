# Perubahan \& langkah pasang (WiwikSayur.id di Rumahweb)

## Yang diperbaiki

1. **Login Google** (tombol di /auth) + endpoint `POST /api/auth/google` (verifikasi token ke Google, akun dibuat otomatis).
2. **Login/daftar email sekarang benar-benar memanggil API** (sebelumnya hanya tiruan di browser).
3. **Produk beranda diambil dari database** (sebelumnya 3 produk tetap di kode).
4. **Checkout** memakai token login; simulasi "pembayaran sukses" palsu dihapus. Subtotal dihitung ulang di server dari harga database.
5. **File yang hilang** ditambahkan: `api/config/database.php`, `api/config/constants.php`.
6. **Halaman baru**: /kebijakan-privasi, /refund-pembatalan, /syarat-ketentuan, /pengiriman (+ link di footer, + persetujuan di form daftar).
7. `api/config/.htaccess` memblokir akses langsung ke `env.php`; CORS dibatasi ke wiwiksayur.id.

## Langkah

1. **Isi data toko**: `frontend/src/data/policies.js` (bagian STORE: nama pemilik, alamat, email, WhatsApp, area, kota, tanggal). Ubah juga alamat/telepon/email di `src/components/Footer.js` agar sama.
2. **Google Cloud Console** > Credentials > Create OAuth client ID (Web application).
Authorized JavaScript origins: `https://wiwiksayur.id` dan `https://www.wiwiksayur.id`. (Tidak perlu redirect URI.)
3. Salin `frontend/.env.example` jadi `frontend/.env`, isi Client ID yang sama.
4. Di hosting, salin `api/config/env.example.php` jadi `env.php`, isi database, Midtrans, `GOOGLE\\\_CLIENT\\\_ID` (sama), `APP\\\_URL`, dan `JWT\\\_SECRET` acak.
5. Di komputer: `cd frontend \\\&\\\& npm install \\\&\\\& npm run build`, lalu upload isi `frontend/build/` ke `public\\\_html/`, dan folder `api/` ke `public\\\_html/api/`.
6. Import `database/schema.sql` (tabel `users` sudah punya kolom `picture`, tidak perlu migrasi).
7. **Ganti password admin**. Buat hash: `php -r "echo password\\\_hash('PASSWORD\\\_BARU', PASSWORD\\\_BCRYPT);"`, lalu di phpMyAdmin:
`UPDATE users SET password\\\_hash='HASH' WHERE email='admin@wiwiksayur.id';`
8. Midtrans Dashboard > Settings > Payment > **Payment Notification URL**: `https://wiwiksayur.id/api/orders/callback`.

## Update: tampilan homepage asli

Homepage, navbar, keranjang, dan pemilih berat (250 g / 500 g / 1 kg / 2 kg / gram bebas) sekarang mengikuti repo asli `wiwiksayur.id`, tetapi memakai API PHP.

* Harga per kg dihitung sesuai berat (dibulatkan ke rupiah), baik di keranjang, checkout, maupun di server.
* Produk bersatuan selain kg (ikat, sisir, buah, 500g) memakai pemilih jumlah biasa.
* Keranjang tersimpan di browser. Badge "Pelanggan Setia" muncul jika `completed\\\_order\\\_count` >= 10.
* Nomor WhatsApp di STORE.phone diambil dari kode asli (+62 858-1442-0843); periksa kembali.
* Belum dipindah ke versi PHP: dashboard admin versi asli (analitik, harga massal, notifikasi pesanan baru), peta pelacakan, dan pengaturan ongkir. Admin yang ada tetap versi Antigravity.

## Update 3: panel admin sungguhan + kompatibilitas Rumahweb

**Panel admin** (`/admin`, login dengan akun admin) memakai data asli dari database:

* **Pesanan**: tab per status (Perlu Diproses, Dikemas, Dikirim, Menunggu Bayar, Selesai, Dibatalkan), pencarian, detail pesanan lengkap (barang + berat, alamat, catatan, ongkir, diskon), tombol langkah berikutnya, buka peta, chat WhatsApp pelanggan dengan pesan otomatis, cetak slip kemas, batalkan.
* Daftar pesanan memuat ulang otomatis tiap 20 detik; pesanan baru memunculkan notifikasi + bunyi + angka di judul tab.
* **Ringkasan**: omzet hari ini / bulan ini, grafik 7 hari, stok menipis.
* **Produk**: tambah/edit, ubah stok langsung, sembunyikan/tampilkan. **Voucher**: buat \& aktif/nonaktifkan. **Pesan**: pesan dari form kontak, balas via WhatsApp/email.
* Stok berkurang otomatis saat pembayaran diterima, dikembalikan bila pesanan dibatalkan; voucher dihitung terpakai; pesanan Selesai menambah hitungan Pelanggan Setia.

**Perubahan agar jalan di Rumahweb**

* Header login (Authorization) dibaca lewat `$\\\_SERVER` + aturan `.htaccess`, karena `apache\\\_request\\\_headers()` sering tidak ada di shared hosting.
* Zona waktu MySQL diset WIB agar sesi login tidak salah kedaluwarsa.
* Ongkir dan diskon voucher kini dihitung ulang di server (sebelumnya voucher di checkout palsu/tertulis di kode, dan alamat default berisi alamat contoh).
* Wajib PHP 8.1+ dengan ekstensi PDO MySQL dan cURL (menu cPanel > Select PHP Version).

**Jika database sudah terlanjur di-import dari schema lama**, jalankan `database/migrasi\\\_admin.sql` sekali di phpMyAdmin (menambah kolom nama \& HP penerima di tabel orders). Bila belum import, cukup pakai `schema.sql` terbaru.

**Batasan yang masih ada**

* Jarak pengiriman di checkout masih tetap 2,4 km (belum ada geocoding alamat). Admin dapat melihat alamat \& membuka peta, dan bila perlu menagih selisih ongkir lewat WhatsApp.
* Gambar produk berupa link URL (belum ada unggah file).
* Halaman pelacakan pelanggan (/track) belum terhubung ke data pesanan.

