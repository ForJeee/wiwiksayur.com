// Hitungan ongkir sisi browser (pratinjau). Aturan yang sama dipakai server saat pesanan dibuat;
// jarak & ongkir final selalu dihitung ulang oleh server.
export const DEFAULT_SHIPPING = {
  store_lat: -6.208326360287679,
  store_lng: 106.79637092720068,
  max_radius_km: 0,
  base_km: 2,
  base_fee: 8000,
  per_km_fee: 2500,
  free_enabled: true,
  free_tiers: [
    { min_spend: 200000, max_km: 1 },
    { min_spend: 300000, max_km: 2 },
    { min_spend: 400000, max_km: 4 },
    { min_spend: 1000000, max_km: 7 },
  ],
};

const rad = (x) => (x * Math.PI) / 180;

// Jarak lurus (km) dua titik, dibulatkan 2 desimal (rumus sama dengan server).
export function distanceKm(a, b) {
  const r = 6371.0088;
  const dp = rad(b.lat - a.lat);
  const dl = rad(b.lng - a.lng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dl / 2) ** 2;
  const d = 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(d * 100) / 100;
}

export function isFree(cfg, dist, subtotal) {
  if (!cfg.free_enabled) return false;
  return cfg.free_tiers.some((t) => subtotal >= Number(t.min_spend) && dist <= Number(t.max_km));
}

export function shippingFee(cfg, dist, subtotal) {
  if (isFree(cfg, dist, subtotal)) return 0;
  if (dist <= Number(cfg.base_km)) return Math.round(Number(cfg.base_fee));
  return Math.round(Number(cfg.base_fee) + Math.ceil(dist - Number(cfg.base_km)) * Number(cfg.per_km_fee));
}

// Selisih belanja agar dapat gratis ongkir di jarak ini. null = tidak ada aturan yang bisa dicapai di jarak ini.
export function freeShippingGap(cfg, dist, subtotal) {
  if (!cfg.free_enabled) return null;
  const options = cfg.free_tiers.filter((t) => dist <= Number(t.max_km) && Number(t.min_spend) > subtotal);
  if (!options.length) return null;
  return Math.min(...options.map((t) => Number(t.min_spend))) - subtotal;
}

export const fmtKm = (n) => `${String(Number(n).toFixed(2)).replace(/\.?0+$/, '').replace('.', ',')} km`;
