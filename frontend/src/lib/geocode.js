// Pencarian alamat GRATIS tanpa kunci API & tanpa billing.
// - Nominatim (OpenStreetMap): cari alamat & nama alamat dari titik (batas: 1 permintaan/detik, ditangani di sini)
// - Photon (komoot, berbasis OSM): saran otomatis saat mengetik + cadangan bila Nominatim gagal
// - BigDataCloud (reverse client, gratis tanpa kunci): cadangan terakhir untuk nama alamat dari titik

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const PHOTON = 'https://photon.komoot.io';
const BDC = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

async function getJson(url, { timeout = 7000, signal } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Nominatim hanya mengizinkan ~1 permintaan/detik: antrekan semua panggilan ke Nominatim
let gate = Promise.resolve();
function nominatimJson(path, opts) {
  const run = gate.then(() => getJson(NOMINATIM + path, opts));
  gate = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)));
  return run;
}

const uniq = (arr) => arr.filter((v, i) => v && arr.indexOf(v) === i);

function nominatimLabel(r) {
  return String(r.display_name || '').replace(/,\s*Indonesia$/i, '').trim();
}

function photonLabel(p) {
  return uniq([
    p.name,
    [p.street, p.housenumber].filter(Boolean).join(' '),
    p.district || p.locality,
    p.city || p.county,
    p.state,
  ]).join(', ');
}

const viewbox = (near, d = 0.4) =>
  near ? `&viewbox=${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}` : '';

// Saran saat mengetik (Photon). Mengembalikan [] bila gagal (tidak pernah melempar error).
export async function suggestPlaces(q, near, signal) {
  try {
    const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : '';
    const j = await getJson(`${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=6${bias}`, { timeout: 5000, signal });
    return (j.features || [])
      .filter((f) => (f.properties || {}).countrycode === 'ID')
      .map((f) => ({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], label: photonLabel(f.properties) }))
      .filter((s) => s.label);
  } catch (e) {
    return [];
  }
}

// Cari koordinat dari teks. Mengembalikan { lat, lng, label } atau melempar Error berpesan Indonesia.
export async function geocodeAddress(address, near) {
  const q = encodeURIComponent(address);
  try {
    const j = await nominatimJson(`/search?format=jsonv2&limit=1&countrycodes=id&accept-language=id&q=${q}${viewbox(near)}`);
    if (j && j[0]) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), label: nominatimLabel(j[0]) };
  } catch (e) { /* lanjut ke cadangan */ }
  try {
    const list = await suggestPlaces(address, near);
    if (list[0]) return list[0];
  } catch (e) { /* abaikan */ }
  throw new Error('Alamat tidak ditemukan. Tambahkan nama jalan, kelurahan, atau kota, atau ketuk langsung di peta.');
}

const cache = new Map();

// Nama alamat dari titik. Tidak pernah melempar error: { label, status } (status 'OK' bila berhasil).
export async function reverseGeocode(pos) {
  const key = pos.lat.toFixed(5) + ',' + pos.lng.toFixed(5);
  if (cache.has(key)) return cache.get(key);
  let label = null;

  try {
    const j = await nominatimJson(`/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=id&lat=${pos.lat}&lon=${pos.lng}`);
    if (j && j.display_name) label = nominatimLabel(j);
  } catch (e) { /* lanjut */ }

  if (!label) {
    try {
      const j = await getJson(`${BDC}?latitude=${pos.lat}&longitude=${pos.lng}&localityLanguage=id`, { timeout: 6000 });
      label = uniq([j.locality, j.city, j.principalSubdivision, j.countryName]).join(', ') || null;
    } catch (e) { /* lanjut */ }
  }

  if (!label) {
    try {
      const j = await getJson(`${PHOTON}/reverse?lat=${pos.lat}&lon=${pos.lng}`, { timeout: 6000 });
      const f = (j.features || [])[0];
      if (f) label = photonLabel(f.properties) || null;
    } catch (e) { /* menyerah */ }
  }

  const out = { label, status: label ? 'OK' : 'ZERO_RESULTS' };
  if (label) cache.set(key, out);
  return out;
}
