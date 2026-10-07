// ISI DATA TOKO DI BAWAH INI. Semua halaman kebijakan otomatis memakai data ini.
export const STORE = {
  "name": "wiwiksayur.com",
  "url": "https://wiwiksayur.com",
  "owner": "Bagus Satrio Wibowo",
  "address": "Jl. Palmerah Sel. No.145 4, RT.4/RW.2, Gelora, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10270",
  "email": "cs@wiwiksayur.com",
  "phone": "+62 858-1442-0843",
  "hours": "Senin–Minggu, 04.00–00.00 WIB",
  "area": "Jakarta Barat-Jakarta Pusat",
  "city": "Jakarta Barat",
  "updated": "03/10/2026"
};

const fill = (t) => t && t
  .replace(/\$\{n\}/g, STORE.name).replace(/\$\{url\}/g, STORE.url).replace(/\$\{owner\}/g, STORE.owner)
  .replace(/\$\{address\}/g, STORE.address).replace(/\$\{email\}/g, STORE.email).replace(/\$\{phone\}/g, STORE.phone)
  .replace(/\$\{hours\}/g, STORE.hours).replace(/\$\{area\}/g, STORE.area).replace(/\$\{city\}/g, STORE.city);

const RAW = {
 "kebijakan-privasi": {
  "title": "Kebijakan Privasi",
  "intro": "Kebijakan ini menjelaskan bagaimana ${n} mengumpulkan, menggunakan, dan melindungi data pribadi Anda sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.",
  "sections": [
   {
    "h": "1. Data yang kami kumpulkan",
    "ul": [
     "Data akun: nama, email, nomor telepon, kata sandi (disimpan ter-hash), dan foto profil bila mendaftar lewat Google.",
     "Data pesanan: alamat pengiriman, daftar produk, voucher, dan status pesanan.",
     "Data pembayaran: status dan referensi transaksi dari Midtrans. Kami tidak menyimpan nomor kartu, CVV, PIN, atau kredensial e-wallet/internet banking Anda.",
     "Data teknis: alamat IP, jenis perangkat/peramban, dan penyimpanan lokal untuk menjaga sesi login dan keranjang."
    ]
   },
   {
    "h": "2. Tujuan penggunaan data",
    "ul": [
     "Membuat akun dan memproses login.",
     "Memproses, mengirim, dan melacak pesanan serta menghitung ongkos kirim.",
     "Memproses pembayaran melalui mitra payment gateway.",
     "Menanggapi pertanyaan, keluhan, dan permintaan refund.",
     "Mencegah penipuan, menjaga keamanan, dan memenuhi kewajiban hukum."
    ]
   },
   {
    "h": "3. Login dengan Google",
    "p": "Jika Anda masuk dengan Google, kami hanya menerima nama, alamat email, dan foto profil. Kami tidak mengakses kata sandi Google, kontak, atau isi email Anda."
   },
   {
    "h": "4. Berbagi data dengan pihak ketiga",
    "p": "Kami tidak menjual data pribadi Anda. Data dibagikan seperlunya kepada PT Midtrans dan penyedia metode pembayaran, kurir/mitra pengantaran, Google (login dan peta), penyedia hosting, serta otoritas berwenang bila diwajibkan hukum."
   },
   {
    "h": "5. Penyimpanan dan keamanan",
    "p": "Data disimpan selama akun aktif dan selama diperlukan untuk pencatatan transaksi. Kami menggunakan HTTPS, penyimpanan kata sandi ter-hash, dan pembatasan akses admin. Tidak ada sistem yang sepenuhnya aman, namun kami berupaya menjaga data Anda secara wajar."
   },
   {
    "h": "6. Hak Anda",
    "p": "Anda berhak mengakses, memperbarui, meminta salinan, dan meminta penghapusan data pribadi, serta menarik persetujuan. Kirim permintaan ke ${email}; kami merespons dalam 3–14 hari kerja."
   },
   {
    "h": "7. Cookie dan penyimpanan lokal",
    "p": "Kami memakai penyimpanan lokal peramban yang diperlukan untuk login dan keranjang belanja. Menghapusnya dapat membuat beberapa fitur tidak berfungsi."
   },
   {
    "h": "8. Pengguna di bawah umur",
    "p": "Layanan ditujukan bagi pengguna berusia 18 tahun ke atas atau di bawah pengawasan orang tua/wali."
   },
   {
    "h": "9. Perubahan kebijakan",
    "p": "Kami dapat memperbarui kebijakan ini dan akan menampilkan tanggal pembaruan di bagian atas halaman."
   },
   {
    "h": "10. Kontak",
    "p": "${n}, ${address}. Email: ${email}. Telepon/WhatsApp: ${phone}."
   }
  ]
 },
 "refund-pembatalan": {
  "title": "Kebijakan Pengembalian Dana & Pembatalan Pesanan",
  "intro": "Karena produk kami berupa sayur dan buah segar yang mudah rusak, ketentuan berikut berlaku untuk semua pesanan di ${n}.",
  "sections": [
   {
    "h": "A. Pembatalan pesanan",
    "ul": [
     "Belum dibayar: pesanan otomatis dibatalkan bila pembayaran tidak diselesaikan dalam batas waktu di halaman pembayaran (umumnya 24 jam).",
     "Sudah dibayar, belum diproses/dikemas: dapat dibatalkan. Hubungi kami di ${phone} atau ${email} dengan menyebutkan nomor pesanan.",
     "Sudah dikemas atau dalam pengiriman: tidak dapat dibatalkan karena produk segar bersifat mudah rusak.",
     "Kami berhak membatalkan pesanan bila stok habis, alamat di luar jangkauan, atau terindikasi penipuan. Dana dikembalikan penuh."
    ]
   },
   {
    "h": "B. Syarat pengajuan refund atau penggantian",
    "p": "Anda dapat mengajukan komplain bila produk rusak, busuk, atau tidak segar saat diterima; tidak sesuai pesanan; kurang dari berat/jumlah yang dipesan; atau pesanan tidak sampai.",
    "ul": [
     "Ajukan maksimal 24 jam setelah pesanan diterima.",
     "Sertakan foto atau video produk dan kemasan (disarankan video saat membuka paket) beserta nomor pesanan.",
     "Produk belum dikonsumsi/diolah, kecuali kerusakan baru terlihat setelah dibuka."
    ]
   },
   {
    "h": "C. Yang tidak dapat direfund",
    "ul": [
     "Perubahan pikiran, atau perbedaan selera/ukuran/tingkat kematangan yang masih wajar untuk produk alami.",
     "Kerusakan akibat penyimpanan yang kurang tepat setelah barang diterima.",
     "Pesanan gagal terkirim karena alamat salah, nomor tidak aktif, atau penerima tidak dapat dihubungi.",
     "Komplain yang diajukan lewat 24 jam atau tanpa bukti foto/video."
    ]
   },
   {
    "h": "D. Proses dan bentuk penyelesaian",
    "ul": [
     "Komplain diverifikasi dalam 1×24 jam kerja.",
     "Bila disetujui, Anda dapat memilih pengiriman ulang/penggantian (bila stok tersedia), voucher, atau pengembalian dana sesuai nilai produk bermasalah.",
     "Refund dikembalikan ke metode pembayaran asal atau rekening/e-wallet atas nama pembeli dalam 3–14 hari kerja sejak disetujui, tergantung bank atau penyedia pembayaran.",
     "Ongkos kirim dikembalikan hanya bila kesalahan ada pada pihak kami."
    ]
   },
   {
    "h": "E. Kontak komplain",
    "p": "Email: ${email}. WhatsApp: ${phone}. Jam layanan: ${hours}."
   }
  ]
 },
 "syarat-ketentuan": {
  "title": "Syarat & Ketentuan",
  "intro": "Dengan mengakses atau berbelanja di ${url}, Anda menyetujui syarat dan ketentuan berikut.",
  "sections": [
   {
    "h": "1. Tentang kami",
    "p": "${n} adalah toko online sayur dan buah segar yang dikelola oleh ${owner}, beralamat di ${address}."
   },
   {
    "h": "2. Akun",
    "p": "Anda wajib memberikan data yang benar dan menjaga kerahasiaan akun. Aktivitas melalui akun Anda menjadi tanggung jawab Anda."
   },
   {
    "h": "3. Produk dan harga",
    "p": "Semua harga dalam Rupiah (IDR) dan dapat berubah sewaktu-waktu. Harga yang berlaku adalah harga saat pesanan dibuat. Gambar produk bersifat ilustrasi; ukuran dan warna produk alami dapat sedikit berbeda. Ketersediaan bergantung pada stok."
   },
   {
    "h": "4. Pemesanan dan pembayaran",
    "p": "Pesanan sah setelah pembayaran diterima. Pembayaran diproses melalui Midtrans dengan metode yang tersedia (transfer bank/virtual account, e-wallet, kartu, dan lainnya). Kami tidak menyimpan data kartu atau kredensial pembayaran Anda."
   },
   {
    "h": "5. Voucher",
    "p": "Voucher mengikuti syarat masing-masing (periode, minimum belanja, kuota) dan tidak dapat diuangkan. Penyalahgunaan voucher dapat menyebabkan pembatalan pesanan."
   },
   {
    "h": "6. Pengiriman, pembatalan, dan refund",
    "p": "Diatur dalam Kebijakan Pengiriman serta Kebijakan Pengembalian Dana & Pembatalan Pesanan di situs ini."
   },
   {
    "h": "7. Larangan",
    "p": "Dilarang menggunakan situs untuk kegiatan melanggar hukum, meretas, menyalahgunakan sistem, atau memberikan data palsu."
   },
   {
    "h": "8. Batasan tanggung jawab",
    "p": "Kami tidak bertanggung jawab atas keterlambatan atau kegagalan akibat keadaan di luar kendali (bencana alam, gangguan jaringan, cuaca ekstrem, gangguan layanan pihak ketiga), sejauh diizinkan hukum."
   },
   {
    "h": "9. Hukum yang berlaku",
    "p": "Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan secara musyawarah, dan bila tidak tercapai, melalui pengadilan yang berwenang di ${city}."
   },
   {
    "h": "10. Kontak",
    "p": "Email: ${email}. WhatsApp: ${phone}."
   }
  ]
 },
 "pengiriman": {
  "title": "Kebijakan Pengiriman",
  "intro": "Informasi pengiriman pesanan dari ${n}.",
  "sections": [
   {
    "h": "1. Area dan metode",
    "p": "Kami melayani pengiriman ke area ${area}. Pesanan dikirim melalui kurir toko atau mitra pengantaran. Alamat di luar jangkauan tidak dapat diproses."
   },
   {
    "h": "2. Ongkos kirim",
    "p": "Dihitung otomatis berdasarkan jarak dari toko ke alamat Anda dan ditampilkan sebelum pembayaran. Promo gratis ongkir mengikuti syarat voucher yang berlaku."
   },
   {
    "h": "3. Waktu pengiriman",
    "ul": [
     "Jam operasional: ${hours}.",
     "Estimasi tiba mengikuti informasi di halaman checkout dan dapat berubah karena cuaca atau lalu lintas."
    ]
   },
   {
    "h": "4. Penerimaan barang",
    "p": "Pastikan alamat dan nomor telepon benar serta mudah dihubungi. Periksa barang saat diterima; bila ada masalah, ikuti Kebijakan Pengembalian Dana & Pembatalan (maksimal 24 jam, disertai foto/video)."
   },
   {
    "h": "5. Gagal kirim",
    "p": "Jika penerima tidak dapat dihubungi atau alamat salah, kami akan menghubungi Anda. Pesanan yang gagal terkirim karena kelalaian pembeli tidak dapat direfund karena produk segar tidak dapat disimpan."
   },
   {
    "h": "6. Kontak",
    "p": "Email: ${email}. WhatsApp: ${phone}."
   }
  ]
 }
};

export const POLICIES = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, {
  title: v.title,
  intro: fill(v.intro),
  sections: v.sections.map((s) => ({ h: s.h, p: fill(s.p), ul: s.ul && s.ul.map(fill) })),
}]));
