// Lokasi toko & hitungan jarak/ongkir untuk halaman checkout.
// Aturan ongkir sama dengan sebelumnya (tarif dasar Rp 8.000 sampai 2 km, lalu Rp 2.500 per km berikutnya,
// gratis ongkir untuk kombinasi belanja & jarak tertentu).

export const STORE_LOCATION = { lat: -6.208326360287679, lng: 106.79637092720068 };

// Jarak yang dipakai bila alamat diisi manual dan belum dihitung lewat peta
export const DEFAULT_DISTANCE_KM = 2.4;

const rad = (x) => (x * Math.PI) / 180;

// Jarak lurus (km) antara dua titik, dibulatkan 2 desimal
export function distanceBetween(a, b) {
  const r = 6371.0088;
  const dp = rad(b.lat - a.lat);
  const dl = rad(b.lng - a.lng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dl / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.min(1, Math.sqrt(h))) * 100) / 100;
}

export function calcShippingFee(distance, subtotal) {
  const d = distance, sb = subtotal;
  if ((sb >= 1000000 && d <= 7) || (sb >= 400000 && d <= 4) || (sb >= 300000 && d <= 2) || (sb >= 200000 && d <= 1)) return 0;
  return d <= 2 ? 8000 : 8000 + Math.ceil(d - 2) * 2500;
}

export const fmtKm = (n) => `${String(Number(n).toFixed(2)).replace(/\.?0+$/, '').replace('.', ',')} km`;
