# 🥬 PANDUAN LENGKAP HOSTING WIWIKSAYUR.ID DI RUMAHWEB.COM

Panduan ini dirancang khusus untuk pemula maupun developer agar dapat mengunggah dan menjalankan website **WiwikSayur.id** di shared hosting cPanel **Rumahweb.com** dengan lancar dan aman.

---

## 📁 Struktur Berkas Proyek di Hosting

Setelah semua proses selesai, struktur berkas di dalam folder `public_html` cPanel Anda akan tampak seperti ini:

```text
public_html/
├── api/                             # Backend REST API (PHP 8.x)
│   ├── config/
│   │   ├── database.php             # Koneksi PDO MySQL
│   │   ├── constants.php            # Konstanta & API Keys
│   │   └── env.php                  # Kredensial rahasia (DB & Google Maps)
│   ├── middleware/
│   │   ├── auth.php                 # Validasi sesi token & role admin
│   │   └── cors.php                 # Header CORS
│   ├── routes/
│   │   ├── auth.php                 # Register, Login, Me, Logout
│   │   ├── products.php             # Katalog Sayur & Buah, Filter, CRUD
│   │   ├── orders.php               # Checkout, status pesanan, Midtrans
│   │   ├── shipping.php             # Geocoding & Jarak Google Maps
│   │   ├── vouchers.php             # Validasi kupon promo
│   │   ├── admin.php                # Statistik dashboard penjualan
│   │   └── contact.php              # Form kirim pesan kontak
│   ├── .htaccess                    # URL rewrite khusus endpoint /api/
│   └── index.php                    # Router utama API
│
├── static/                          # Aset CSS & JS React (hasil build)
│   ├── css/
│   └── js/
├── index.html                       # Entry point aplikasi web
├── .htaccess                        # URL rewrite root untuk SPA React
└── favicon.ico                      # Ikon website
```

---

## 🚀 Langkah 1: Buat Database MySQL di cPanel Rumahweb

1. **Login ke cPanel** Rumahweb (biasanya melalui `https://namadomain.com/cpanel` atau portal ClientZone Rumahweb).
2. Cari dan klik menu **MySQL Databases** di bagian *Databases*.
3. **Buat Database Baru**:
   - Contoh: ketik `wiwiksayur` pada kolom *New Database* (nama lengkapnya akan menjadi `usercpanel_wiwiksayur`).
   - Klik **Create Database**.
4. **Buat Pengguna MySQL (MySQL Users)**:
   - Scroll ke bawah ke bagian *Add New User*.
   - Username: misal `dbuser` (menjadi `usercpanel_dbuser`).
   - Password: buat password yang kuat (klik *Password Generator*). **Catat password ini!**
   - Klik **Create User**.
5. **Hubungkan Pengguna ke Database**:
   - Pada bagian *Add User To Database*, pilih User dan Database yang baru dibuat.
   - Klik **Add**.
   - Centang opsi **ALL PRIVILEGES**.
   - Klik **Make Changes**.

---

## 🗄️ Langkah 2: Import Database (`schema.sql`) via phpMyAdmin

1. Kembali ke beranda cPanel, lalu klik menu **phpMyAdmin**.
2. Pada panel sebelah kiri, klik nama database Anda (`usercpanel_wiwiksayur`).
3. Klik tab **Import** di bagian atas menu.
4. Klik **Choose File** / **Browse...** lalu pilih file:
   `wiwiksayur/database/schema.sql`
5. Biarkan pengaturan lainnya default, lalu klik tombol **Go** / **Kirim** di paling bawah.
6. Tunggu hingga muncul pesan hijau sukses: *"Import has been successfully finished"*.
   > Database sudah langsung terisi:
   > - Akun Admin default: `admin@wiwiksayur.id` (Password: `admin123`)
   > - 12 Katalog Produk Sayuran & Buah Segar pilihan beserta gambar HD
   > - 3 Kupon Diskon siap pakai (`SEGAR20`, `HEMAT10RB`, `PELANGGANBARU`)
   > - Pengaturan titik toko & tarif ongkir

---

## 🗺️ Langkah 3: Menyiapkan Google Maps API Key

WiwikSayur.id menggunakan **Google Maps Platform API** untuk geocoding alamat pembeli, menghitung rute kurir pengiriman secara akurat, dan menampilkan peta toko.

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada.
3. Masuk ke menu **APIs & Services** > **Library**, lalu aktifkan 4 API berikut:
   - **Maps JavaScript API** (menampilkan peta di website)
   - **Geocoding API** (mencari koordinat lat/lng dari teks alamat)
   - **Directions API** (menghitung rute & jarak km dari toko ke rumah pembeli)
   - **Places API** (autocomplete pencarian alamat)
4. Masuk ke menu **Credentials** > klik **Create Credentials** > **API Key**.
5. Salin API Key yang dihasilkan (contoh format: `AIzaSy...`).

---

## ⚙️ Langkah 4: Konfigurasi File `env.php` di Hosting

1. Di cPanel, buka **File Manager** dan masuk ke folder `public_html/api/config/`.
2. Buat file baru bernama `env.php` (atau salin dari `env.example.php`).
3. Masukkan kode berikut dengan kredensial database Anda:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'usercpanel_wiwiksayur');  // Ganti sesuai nama DB di cPanel
define('DB_USER', 'usercpanel_dbuser');       // Ganti sesuai user DB di cPanel
define('DB_PASS', 'PasswordDatabaseAnda123'); // Ganti sesuai password DB Anda

// API Key Google Maps
define('GOOGLE_MAPS_API_KEY', 'AIzaSy_KUNCI_GOOGLE_MAPS_ANDA');

// Payment Gateway Midtrans (Opsional / bisa testing sandbox)
define('MIDTRANS_SERVER_KEY', 'SB-Mid-server-XXXXX');
define('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-XXXXX');
define('MIDTRANS_IS_PRODUCTION', false);

// URL Toko
define('APP_URL', 'https://namadomainanda.com');
define('JWT_SECRET', 'kunci_rahasia_acak_wiwiksayur_2026');
```

4. Simpan file (`Save Changes`).

---

## 💻 Langkah 5: Build Frontend & Upload ke Rumahweb

### A. Di Komputer Lokal Anda:
Buka Command Prompt / PowerShell di folder proyek frontend:
```bash
cd "C:\Users\Hype AMD\.gemini\antigravity\scratch\wiwiksayur\frontend"

# 1. Install dependencies
npm install

# 2. Build aplikasi menjadi file statis siap hosting
npm run build
```
Setelah selesai, sebuah folder bernama `build/` akan tercipta.

### B. Upload ke cPanel Rumahweb:
1. Masuk ke **File Manager** cPanel > buka folder `public_html`.
2. Upload seluruh isi folder `build/` (yaitu file `index.html`, folder `static/`, dll.) langsung ke dalam `public_html`.
3. Upload folder `api/` dari proyek ke `public_html/api/`.
4. Pastikan file `.htaccess` di root `public_html` berisi konfigurasi berikut:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Jangan arahkan request API ke index.html
  RewriteRule ^api/ - [L]
  
  # Arahkan semua request non-file ke SPA React
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔐 Langkah 6: Akses Website & Panel Admin

1. **Akses Toko**:
   Buka browser dan kunjungi `https://namadomainanda.com/`
   - Hero banner dengan slogan **"Menyediakan Sayuran & Buah Fresh"**
   - Halaman **Tentang Kami** (`/tentang-kami`)
   - Halaman **Kontak** (`/kontak`) lengkap dengan titik peta Google Maps dan form pesan
   - Keranjang belanja & checkout dengan kalkulator ongkos kirim presisi

2. **Akses Panel Administrator**:
   Kunjungi `https://namadomainanda.com/admin`
   - **Email**: `admin@wiwiksayur.id`
   - **Password**: `admin123`
   
   Fitur Panel Admin Profesional:
   - 📊 **Dashboard**: Grafik omset harian, metrik pendapatan, pesanan baru
   - 🥬 **Kelola Produk**: Tambah produk sayur/buah baru, atur stok & foto
   - 📦 **Daftar Pesanan**: Pantau pesanan masuk, ubah status kirim, rincian nota
   - 🎟️ **Voucher**: Buat kupon promo diskon persen atau potongan nominal
   - 👥 **Pelanggan**: Data pelanggan & badge *Pelanggan Setia*
   - 💬 **Pesan Masuk**: Membaca pertanyaan pembeli dari formulir kontak
   - ⚙️ **Pengaturan Toko**: Menentukan titik koordinat Google Maps & tarif ongkir

---

## 🛠️ Tips Troubleshooting di Rumahweb

| Gejala | Penyebab Umum | Solusi |
|---|---|---|
| **500 Internal Server Error saat panggil API** | Salah password DB atau ekstensi PDO belum aktif | Cek kembali `api/config/env.php`. Di cPanel, pastikan versi PHP diset minimal **PHP 8.1** di menu *Select PHP Version*. |
| **Peta Google Maps blank / error** | API key belum diisi atau kuota habis | Pastikan API key di `env.php` dan `index.html` valid dan sudah mengaktifkan *Maps JavaScript API*. |
| **Halaman 404 saat refresh browser di menu Tentang Kami / Kontak** | `.htaccess` belum ada di `public_html` | Pastikan opsi *Show Hidden Files (dotfiles)* diaktifkan di File Manager cPanel, lalu pastikan file `.htaccess` sudah terupload di root. |
