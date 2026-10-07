import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = { lat: -6.208326360287679, lng: 106.79637092720068 };

// Pin berupa SVG (tanpa file gambar, jadi aman saat build)
const pinIcon = (color) =>
  L.divIcon({
    className: '',
    iconSize: [30, 42],
    iconAnchor: [15, 41],
    html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 1C7.3 1 1 7.2 1 14.8 1 25 15 41 15 41s14-16 14-26.2C29 7.2 22.7 1 15 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>`,
  });
const ICON_PIN = pinIcon('#dc2626');
const ICON_STORE = pinIcon('#16a34a');

const toPos = (ll) => ({ lat: ll.lat, lng: ll.lng });

// Pemuat peta tidak diperlukan lagi (tanpa Google). Tersedia agar kode lama tetap jalan.
export const useMapReady = () => ({ isLoaded: true, loadError: undefined });

/**
 * Peta gratis (Leaflet + OpenStreetMap), props sama seperti peta Google sebelumnya:
 * - center, zoom, markers: peta biasa (halaman Kontak)
 * - store: posisi toko (pin hijau)
 * - pin + onPinChange: titik pengantaran yang bisa digeser
 * - onMapClick: dipanggil saat peta diketuk (menaruh pin)
 * - circle: { center, radiusKm } lingkaran jangkauan (halaman admin Ongkir)
 * - onUnavailable: dipanggil bila peta tidak bisa dimuat
 */
function MapView({ center, zoom = 14, markers = [], store = null, pin = null, circle = null, onPinChange, onMapClick, onUnavailable }) {
  const elRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const layers = React.useRef({ markers: [], store: null, pin: null, circle: null });
  const cb = React.useRef({});
  cb.current = { onPinChange, onMapClick, onUnavailable };
  const userMovedRef = React.useRef(false);
  const [initial] = React.useState(center || store || DEFAULT_CENTER);
  const [broken, setBroken] = React.useState(false);
  const [full, setFull] = React.useState(false);
  const interactive = !!(onMapClick || onPinChange);

  // Buat peta sekali
  React.useEffect(() => {
    if (!elRef.current) return undefined;
    const map = L.map(elRef.current, {
      center: [initial.lat, initial.lng],
      zoom,
      maxZoom: 19,
      scrollWheelZoom: interactive,
      dragging: interactive || !L.Browser.mobile, // peta info di HP tidak menahan gulir halaman
      doubleClickZoom: !interactive,
    });
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(map);
    let ok = 0, bad = 0;
    tiles.on('tileload', () => { ok += 1; });
    tiles.on('tileerror', () => {
      bad += 1;
      if (ok === 0 && bad >= 4) { setBroken(true); if (cb.current.onUnavailable) cb.current.onUnavailable(); }
    });
    map.on('click', (e) => {
      if (!cb.current.onMapClick) return;
      userMovedRef.current = true;
      cb.current.onMapClick(toPos(e.latlng));
    });
    mapRef.current = map;

    // Ukuran peta berubah (tab, layar penuh): hitung ulang
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(elRef.current);
    }
    return () => { if (ro) ro.disconnect(); map.remove(); mapRef.current = null; layers.current = { markers: [], store: null, pin: null, circle: null }; };
    // eslint-disable-next-line
  }, []);

  // Penanda umum
  const markersKey = JSON.stringify(markers);
  React.useEffect(() => {
    const map = mapRef.current; if (!map) return;
    layers.current.markers.forEach((m) => m.remove());
    layers.current.markers = markers.map((p) => L.marker([p.lat, p.lng], { icon: ICON_PIN }).addTo(map));
    // eslint-disable-next-line
  }, [markersKey]);

  // Toko
  React.useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (layers.current.store) { layers.current.store.remove(); layers.current.store = null; }
    if (store) layers.current.store = L.marker([store.lat, store.lng], { icon: ICON_STORE, title: 'Lokasi toko', interactive: false, zIndexOffset: -100 }).addTo(map);
  }, [store]);

  // Lingkaran jangkauan
  const circleKey = circle ? `${circle.center && circle.center.lat},${circle.center && circle.center.lng},${circle.radiusKm}` : '';
  React.useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (layers.current.circle) { layers.current.circle.remove(); layers.current.circle = null; }
    if (circle && circle.center && circle.radiusKm > 0) {
      layers.current.circle = L.circle([circle.center.lat, circle.center.lng], {
        radius: circle.radiusKm * 1000, color: '#059669', weight: 2, fillColor: '#10b981', fillOpacity: 0.12, interactive: false,
      }).addTo(map);
    }
    // eslint-disable-next-line
  }, [circleKey]);

  // Pin pengantaran (bisa digeser)
  React.useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const L0 = layers.current;
    if (!pin) { if (L0.pin) { L0.pin.remove(); L0.pin = null; } return; }
    if (!L0.pin) {
      L0.pin = L.marker([pin.lat, pin.lng], { icon: ICON_PIN, title: 'Titik pengantaran', draggable: !!cb.current.onPinChange, zIndexOffset: 500 }).addTo(map);
      L0.pin.on('dragend', () => {
        if (!cb.current.onPinChange) return;
        userMovedRef.current = true;
        cb.current.onPinChange(toPos(L0.pin.getLatLng()));
      });
    } else {
      L0.pin.setLatLng([pin.lat, pin.lng]);
    }
    // Pin dipindah pengguna: jangan zoom ulang. Pin dari pencarian / lokasi saya: tampilkan toko & pin sekaligus.
    if (userMovedRef.current) { userMovedRef.current = false; return; }
    if (store) map.fitBounds([[store.lat, store.lng], [pin.lat, pin.lng]], { padding: [60, 60], maxZoom: 17 });
    else map.panTo([pin.lat, pin.lng]);
  }, [pin, store]);

  if (broken) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 px-4 text-center">
        Peta tidak dapat dimuat saat ini. Gunakan opsi alamat manual.
      </div>
    );
  }

  return (
    <div className={full ? 'fixed inset-0 z-[2000] bg-white isolate' : 'relative w-full h-full isolate'}>
      <div ref={elRef} className="w-full h-full" style={{ cursor: interactive ? 'crosshair' : undefined }} />
      {interactive && (
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          className="absolute right-2 top-2 z-[500] rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow border border-slate-200"
        >
          {full ? 'Tutup layar penuh' : 'Layar penuh'}
        </button>
      )}
      {onMapClick && !pin && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow">
          Ketuk peta untuk menaruh pin
        </div>
      )}
    </div>
  );
}

export default React.memo(MapView);
