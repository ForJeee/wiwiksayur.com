import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatRupiah } from '../lib/utils';
import MapView from '../components/MapView';
import { geocodeAddress, reverseGeocode, suggestPlaces } from '../lib/geocode';
import { MapPin, Ticket, ShieldCheck, CreditCard, AlertCircle, CheckCircle2, Search, Crosshair, Pencil } from 'lucide-react';
import { api } from '../lib/utils';
import { fmtQty } from '../lib/qty';
import { STORE_LOCATION, DEFAULT_DISTANCE_KM, distanceBetween, calcShippingFee, fmtKm } from '../lib/geo';

const MIDTRANS_CLIENT_KEY = 'Mid-client-viGLekjKyOUm4QLa';
// Jika key diawali Mid- biasanya production, namun jika diset sandbox pakai URL sandbox
const IS_SANDBOX = true; 
const SNAP_URL = IS_SANDBOX 
  ? 'https://app.sandbox.midtrans.com/snap/snap.js' 
  : 'https://app.midtrans.com/snap/snap.js';

export default function Checkout() {
  const { cart, clearCart, user } = useAppContext();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  // Alamat pengiriman: dua pilihan. "map" = pilih titik di peta (nama alamat mengikuti titik), "manual" = ketik sendiri.
  const [addrMode, setAddrMode] = useState('map');
  const [pin, setPin] = useState(null);               // titik pengantaran dari peta
  const [mapAddress, setMapAddress] = useState('');   // nama alamat otomatis sesuai titik (boleh disunting)
  const [addrDetail, setAddrDetail] = useState('');   // no. rumah, RT/RW, patokan
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]); // saran alamat saat mengetik
  const suggestSeq = useRef(0);
  const skipSuggest = useRef(false); // true setelah memilih saran, supaya daftar tidak muncul lagi
  const [manualAddress, setManualAddress] = useState('');
  const [manualPoint, setManualPoint] = useState(null); // titik hasil "Hitung ongkir dari alamat"
  const [loc, setLoc] = useState({ busy: false, bad: false, msg: '' });
  const [mapBroken, setMapBroken] = useState(false);
  const geoSeq = useRef(0); // membuang hasil pencarian nama alamat yang sudah usang
  const [notes, setNotes] = useState('');
  
  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Loading & Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  // Perhitungan Biaya
  const subtotal = cart.reduce((acc, item) => acc + Math.round(item.price * item.quantity), 0);

  // Jarak & ongkir: dari titik di peta; untuk alamat manual dari hasil "Hitung ongkir", jika belum maka jarak standar
  const distanceKm = addrMode === 'map'
    ? (pin ? distanceBetween(STORE_LOCATION, pin) : null)
    : (manualPoint ? distanceBetween(STORE_LOCATION, manualPoint) : DEFAULT_DISTANCE_KM);
  const shippingFee = distanceKm === null ? null : calcShippingFee(distanceKm, subtotal);
  const point = addrMode === 'map' ? pin : manualPoint;

  // Alamat akhir yang dikirim ke penjual
  const finalAddress = addrMode === 'map'
    ? (pin
        ? [addrDetail.trim(), mapAddress.trim()].filter(Boolean).join(', ')
          + `\nTitik peta: https://www.google.com/maps?q=${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`
        : '')
    : manualAddress.trim();
  const addressFilled = addrMode === 'map' ? !!(pin && (mapAddress.trim() || addrDetail.trim())) : manualAddress.trim().length > 0;

  // Diskon Voucher
  const discountAmount = appliedVoucher ? Math.min(appliedVoucher.discount, subtotal) : 0;

  const grandTotal = Math.max(0, subtotal + (shippingFee || 0) - discountAmount);

  // Load Script Midtrans Snap secara dinamis
  useEffect(() => {
    const existingScript = document.getElementById('midtrans-snap-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = SNAP_URL;
      script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
      script.onload = () => setSnapReady(true);
      document.body.appendChild(script);
    } else {
      setSnapReady(true);
    }
  }, []);

  // Menandai titik (ketuk peta / geser pin / hasil cari / lokasi saya): nama alamat ikut menyesuaikan titik
  const pickPoint = useCallback(async (p, okMsg) => {
    setPin(p);
    setLoc({ busy: true, bad: false, msg: 'Mencari nama alamat sesuai titik…' });
    const seq = ++geoSeq.current;
    const { label } = await reverseGeocode(p);
    if (seq !== geoSeq.current) return; // titik sudah berpindah lagi
    if (label) {
      setMapAddress(label);
      setLoc({ busy: false, bad: false, msg: okMsg || 'Alamat disesuaikan dengan titik. Geser pin bila belum tepat di rumah Anda.' });
    } else {
      setMapAddress('');
      setLoc({
        busy: false, bad: true,
        msg: 'Titik tersimpan, tetapi nama alamat belum bisa dibaca. Tulis alamat Anda di kolom bawah.',
      });
    }
  }, []);

  const handleSearch = async () => {
    const q = searchText.trim();
    if (q.length < 3) {
      setLoc({ busy: false, bad: true, msg: 'Ketik nama jalan, tempat, atau kelurahan dulu.' });
      return;
    }
    setSuggestions([]);
    setLoc({ busy: true, bad: false, msg: 'Mencari lokasi…' });
    try {
      const r = await geocodeAddress(q, STORE_LOCATION);
      pickPoint({ lat: r.lat, lng: r.lng }, 'Lokasi ditemukan. Geser pin bila belum tepat di rumah Anda.');
    } catch (e) {
      setLoc({ busy: false, bad: true, msg: e.message });
    }
  };

  // Saran alamat otomatis (jeda 600 ms setelah berhenti mengetik)
  useEffect(() => {
    const q = searchText.trim();
    if (skipSuggest.current) { skipSuggest.current = false; return undefined; }
    if (q.length < 3) { setSuggestions([]); return undefined; }
    const seq = ++suggestSeq.current;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const list = await suggestPlaces(q, STORE_LOCATION, ctrl.signal);
      if (seq === suggestSeq.current) setSuggestions(list);
    }, 600);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [searchText]);

  const pickSuggestion = (s) => {
    setSuggestions([]);
    skipSuggest.current = true;
    setSearchText(s.label);
    suggestSeq.current++;
    pickPoint({ lat: s.lat, lng: s.lng }, 'Lokasi dipilih. Geser pin bila belum tepat di rumah Anda.');
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLoc({ busy: false, bad: true, msg: 'Browser Anda tidak mendukung deteksi lokasi. Ketuk langsung di peta.' });
      return;
    }
    setLoc({ busy: true, bad: false, msg: 'Mendeteksi lokasi Anda…' });
    navigator.geolocation.getCurrentPosition(
      (pos) => pickPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'Lokasi Anda terdeteksi. Geser pin bila perlu.'),
      () => setLoc({ busy: false, bad: true, msg: 'Lokasi tidak dapat diakses. Izinkan akses lokasi di browser, atau ketuk langsung di peta.' }),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Alamat manual: cari titiknya di peta supaya ongkir sesuai jarak (opsional)
  const handleManualDistance = async () => {
    if (manualAddress.trim().length < 8) {
      setLoc({ busy: false, bad: true, msg: 'Tulis alamat lengkap dulu (jalan, kelurahan, kota).' });
      return;
    }
    setLoc({ busy: true, bad: false, msg: 'Menghitung jarak dari alamat…' });
    try {
      const r = await geocodeAddress(manualAddress.trim(), STORE_LOCATION);
      setManualPoint({ lat: r.lat, lng: r.lng });
      setLoc({ busy: false, bad: false, msg: 'Jarak dihitung dari alamat yang Anda tulis. Bila kurang tepat, pilih opsi "Pilih di peta".' });
    } catch (e) {
      setManualPoint(null);
      setLoc({ busy: false, bad: true, msg: e.message + ' Ongkir memakai tarif standar.' });
    }
  };

  // Dipanggil peta bila gagal dimuat: pindah ke alamat manual
  const onMapUnavailable = useCallback(() => { setMapBroken(true); setAddrMode('manual'); }, []);

  const switchMode = (m) => {
    setAddrMode(m);
    setLoc({ busy: false, bad: false, msg: '' });
  };

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    setVoucherError('');
    try {
      const res = await api.post('/vouchers/validate', { code: voucherCode.trim().toUpperCase(), subtotal });
      setAppliedVoucher(res.data.data);
    } catch (err) {
      setAppliedVoucher(null);
      const m = err.response?.data?.message || '';
      setVoucherError(
        m.startsWith('Minimum spend') ? 'Belum mencapai minimal belanja voucher ini' :
        m === 'Voucher expired' ? 'Voucher sudah kedaluwarsa' :
        m === 'Voucher quota exceeded' ? 'Kuota voucher sudah habis' :
        err.response?.status === 401 ? 'Silakan masuk dulu untuk memakai voucher' :
        'Kode voucher tidak ditemukan atau tidak aktif'
      );
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (addrMode === 'map' && !pin) {
      alert('Pilih titik pengantaran di peta, atau pindah ke opsi "Isi alamat manual"');
      return;
    }
    if (!addressFilled) {
      alert('Mohon isi alamat pengiriman lengkap Anda');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Coba request Snap Token ke backend API
      let snapToken = null;
      try {
        const res = await api.post('/orders', {
          items: cart,
          subtotal,
          delivery_fee: shippingFee,
          discount: discountAmount,
          voucher_code: appliedVoucher?.code || null,
          address: finalAddress,
          notes,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          lat: point ? point.lat : null,
          lng: point ? point.lng : null,
          distance_km: distanceKm
        });

        if (res.data?.payment_token) {
          snapToken = res.data.payment_token;
        }
      } catch (apiErr) {
        if (apiErr?.response?.status === 401) {
          alert('Sesi login berakhir. Silakan masuk kembali.');
          navigate('/auth');
        } else {
          alert(apiErr?.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.');
        }
        setIsProcessing(false);
        return;
      }

      // 2. Jika window.snap tersedia dan ada token, buka popup Snap Midtrans
      if (window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: function (result) {
            clearCart();
            navigate(`/payment-result?status=success&order_id=${result.order_id}`);
          },
          onPending: function (result) {
            clearCart();
            navigate(`/payment-result?status=pending&order_id=${result.order_id}`);
          },
          onError: function (result) {
            alert('Pembayaran gagal atau dibatalkan oleh bank');
            setIsProcessing(false);
          },
          onClose: function () {
            setIsProcessing(false);
          }
        });
      } else {
        alert('Pembayaran belum dapat diproses. Muat ulang halaman lalu coba lagi.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses pesanan.');
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4 font-bold">
          🥬
        </div>
        <p className="text-xl font-bold text-gray-800 mb-2">Keranjang Anda Masih Kosong</p>
        <p className="text-gray-500 mb-6 text-sm">Pilih sayuran dan buah segar dari petani sebelum checkout.</p>
        <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700">
          Mulai Belanja Sayur & Buah
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout Pesanan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selesaikan pesanan Anda dengan aman melalui gateway pembayaran Midtrans
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Data Pengiriman & Alamat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Penerima */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">1</span>
                Informasi Penerima
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Nama penerima..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp / HP</label>
                  <Input 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    placeholder="08xxxxxxxxxx"
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Alamat Email (untuk bukti nota bayar)</label>
                <Input 
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)} 
                  placeholder="email@anda.com"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Alamat & Titik Pengiriman (peta OpenStreetMap, gratis) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">2</span>
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Dua pilihan cara mengisi alamat */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[['map', 'Pilih di peta', MapPin], ['manual', 'Isi alamat manual', Pencil]].map(([k, label, Icon]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => switchMode(k)}
                    className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${addrMode === k ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {addrMode === 'map' ? (
                <>
                  <p className="text-xs text-slate-500">
                    Ketuk peta atau geser pin merah ke titik rumah Anda. Nama alamat akan terisi otomatis sesuai titik. Pin hijau adalah lokasi toko.
                  </p>

                  {/* Cari lokasi / lokasi saya */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                        placeholder="Cari jalan, kelurahan, atau nama tempat"
                        className="text-sm"
                        autoComplete="off"
                      />
                      <Button type="button" variant="outline" onClick={handleSearch} disabled={loc.busy} className="px-3 gap-1.5 text-xs flex-shrink-0">
                        <Search className="h-3.5 w-3.5" /> Cari
                      </Button>
                    </div>
                    {suggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {suggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => pickSuggestion(s)}
                              className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50"
                            >
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                              <span>{s.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={handleLocate} disabled={loc.busy} className="w-full h-10 gap-1.5 text-xs">
                    <Crosshair className="h-3.5 w-3.5" /> Gunakan lokasi saya sekarang
                  </Button>

                  <div className="h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <MapView
                      store={STORE_LOCATION}
                      pin={pin}
                      onPinChange={pickPoint}
                      onMapClick={pickPoint}
                      onUnavailable={onMapUnavailable}
                    />
                  </div>

                  {loc.msg && <p className={`text-xs ${loc.bad ? 'text-red-600' : 'text-slate-500'}`}>{loc.msg}</p>}

                  {!pin ? (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Belum ada titik pengantaran. Ketuk peta, cari lokasi, atau gunakan lokasi Anda.</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg text-xs text-emerald-800">
                      <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Perkiraan jarak <strong>{fmtKm(distanceKm)}</strong> dari toko WiwikSayur.com.{' '}
                        {shippingFee === 0 ? <strong>Gratis ongkir.</strong> : <>Ongkir <strong>{formatRupiah(shippingFee)}</strong>.</>}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Alamat sesuai titik (otomatis)</label>
                    <textarea
                      value={mapAddress}
                      onChange={(e) => setMapAddress(e.target.value)}
                      rows={2}
                      disabled={!pin}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder={pin ? 'Nama alamat terisi otomatis' : 'Terisi otomatis setelah Anda memilih titik di peta'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Detail alamat (nomor rumah, RT/RW, patokan)</label>
                    <Input
                      value={addrDetail}
                      onChange={(e) => setAddrDetail(e.target.value)}
                      placeholder="Contoh: No. 12, RT 03/RW 05, pagar hijau dekat warung"
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  {mapBroken && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Peta sedang tidak tersedia, jadi alamat diisi manual. Anda tetap bisa menekan &quot;Hitung ongkir dari alamat ini&quot;.</span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Alamat Lengkap Pengiriman</label>
                    <textarea
                      value={manualAddress}
                      onChange={(e) => { setManualAddress(e.target.value); setManualPoint(null); }}
                      rows={4}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      placeholder="Tulis nama jalan, nomor rumah, RT/RW, kelurahan, kota, patokan khusus..."
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleManualDistance} disabled={loc.busy} className="w-full h-10 gap-1.5 text-xs">
                    <Search className="h-3.5 w-3.5" /> Hitung ongkir dari alamat ini
                  </Button>
                  {loc.msg && <p className={`text-xs ${loc.bad ? 'text-red-600' : 'text-slate-500'}`}>{loc.msg}</p>}
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg text-xs text-emerald-800">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {manualPoint
                        ? <>Perkiraan jarak <strong>{fmtKm(distanceKm)}</strong> dari toko. {shippingFee === 0 ? <strong>Gratis ongkir.</strong> : <>Ongkir <strong>{formatRupiah(shippingFee)}</strong>.</>}</>
                        : <>Ongkir memakai jarak standar <strong>{fmtKm(DEFAULT_DISTANCE_KM)}</strong>. Klik &quot;Hitung ongkir dari alamat ini&quot; atau pilih opsi &quot;Pilih di peta&quot; agar sesuai jarak sebenarnya.</>}
                    </span>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-700">Catatan untuk Penjual / Kurir (Opsional)</label>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Contoh: Titip di satpam / sayuran tolong yang segar baru panen"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Rincian Belanja & Pembayaran Midtrans */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm sticky top-24">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">Ringkasan Belanja</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Daftar Barang */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-sm divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-slate-500">{fmtQty(item.quantity, item.unit)} × {formatRupiah(item.price)}/{item.unit}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(Math.round(item.price * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Form Input Voucher */}
              <div className="border-t border-slate-100 pt-4">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Ticket className="h-3.5 w-3.5 text-emerald-600" /> Punya Kode Voucher?
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={voucherCode} 
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: SEGAR20"
                    className="text-xs uppercase font-mono"
                  />
                  <Button 
                    type="button" 
                    onClick={handleApplyVoucher}
                    variant="outline" 
                    className="text-xs px-3"
                  >
                    Gunakan
                  </Button>
                </div>
                {appliedVoucher && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-700 flex items-center justify-between">
                    <span className="font-semibold">Voucher &quot;{appliedVoucher.code}&quot; aktif!</span>
                    <button onClick={() => setAppliedVoucher(null)} className="text-red-600 hover:underline">Hapus</button>
                  </div>
                )}
                {voucherError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {voucherError}
                  </p>
                )}
              </div>

              {/* Breakdown Biaya */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Sayur & Buah</span>
                  <span className="font-mono font-semibold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim{distanceKm !== null ? ` (${fmtKm(distanceKm)}${addrMode === 'manual' && !manualPoint ? ', standar' : ''})` : ''}</span>
                  <span className="font-mono font-semibold">
                    {shippingFee === null ? <span className="font-sans font-normal text-slate-400">Pilih lokasi</span>
                      : shippingFee === 0 ? <strong className="text-emerald-700">GRATIS</strong> : formatRupiah(shippingFee)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Diskon Voucher</span>
                    <span className="font-mono">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-emerald-700 text-lg">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {/* Tombol Bayar Midtrans */}
              <div className="pt-2 space-y-3">
                <Button 
                  onClick={handlePay} 
                  disabled={isProcessing || (addrMode === 'map' && !pin)} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <CreditCard className="h-4 w-4" />
                  {isProcessing ? 'Memproses Gateway...' : (addrMode === 'map' && !pin) ? 'Pilih Titik Pengantaran' : 'Bayar Sekarang via Midtrans'}
                </Button>

                {/* Badge Keamanan */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Didukung Midtrans Snap (BCA, Mandiri, QRIS, GoPay)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
