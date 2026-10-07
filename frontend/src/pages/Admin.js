import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, LayoutDashboard, Package, Ticket, MessageSquare, LogOut, Store, Search, Printer,
  MessageCircle, MapPin, X, RefreshCw, Bell, Plus, Truck, Trash2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api, formatRupiah } from '../lib/utils';
import { fmtQty, lineTotal } from '../lib/qty';
import { shippingFee as calcFee, isFree } from '../lib/shipping';
import GoogleMapComponent from '../components/GoogleMap';
import Logo from '../components/Logo';

/* ---------- konfigurasi status ---------- */
const ST = {
  pending: { label: 'Menunggu Bayar', cls: 'bg-slate-100 text-slate-700' },
  paid: { label: 'Perlu Diproses', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Dikemas', cls: 'bg-sky-100 text-sky-800' },
  shipping: { label: 'Dikirim', cls: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-red-100 text-red-700' },
};
const NEXT = {
  pending: ['paid', 'Tandai Sudah Dibayar'],
  paid: ['processing', 'Mulai Kemas'],
  processing: ['shipping', 'Kirim Pesanan'],
  shipping: ['completed', 'Tandai Selesai'],
};
const FILTERS = ['paid', 'processing', 'shipping', 'pending', 'completed', 'cancelled', 'all'];

const timeAgo = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  if (m < 1440) return `${Math.floor(m / 60)} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const waLink = (phone, text) => {
  const n = String(phone || '').replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
};
const beep = () => {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); setTimeout(() => { o.stop(); c.close(); }, 350);
  } catch (e) { /* abaikan */ }
};
const errMsg = (e) => e?.response?.data?.message || 'Terjadi kesalahan';

function Badge({ s }) {
  const c = ST[s] || ST.pending;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${c.cls}`}>{c.label}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} h-full overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- slip kemas / cetak ---------- */
function printSlip(o) {
  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) return alert('Izinkan pop-up untuk mencetak.');
  const rows = o.items.map((i) => `<tr><td>${i.name}</td><td style="text-align:right">${fmtQty(i.quantity, i.unit)}</td></tr>`).join('');
  w.document.write(`<html><head><title>${o.midtrans_order_id}</title><style>body{font:14px sans-serif;padding:16px}table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px dashed #999}h2{margin:0}</style></head><body>
  <h2>wiwiksayur.com</h2><p><b>${o.midtrans_order_id}</b><br>${o.created_at}</p><hr>
  <p><b>${o.customer_name || o.user_name}</b><br>${o.customer_phone || o.user_phone || ''}<br>${o.address}</p>
  ${o.notes ? `<p><i>Catatan: ${o.notes}</i></p>` : ''}
  <table>${rows}</table><p style="text-align:right"><b>Total: ${formatRupiah(o.total)}</b></p></body></html>`);
  w.document.close(); w.focus(); w.print();
}

/* ---------- detail pesanan ---------- */
function OrderDetail({ o, onClose, onStatus, busy }) {
  const name = o.customer_name || o.user_name;
  const phone = o.customer_phone || o.user_phone;
  const map = o.lat && o.lng ? `https://www.google.com/maps?q=${o.lat},${o.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`;
  const msg = {
    paid: `Halo ${name}, pesanan ${o.midtrans_order_id} sudah kami terima dan segera dikemas. Terima kasih sudah belanja di wiwiksayur.com 🥬`,
    processing: `Halo ${name}, pesanan ${o.midtrans_order_id} sedang kami kemas.`,
    shipping: `Halo ${name}, pesanan ${o.midtrans_order_id} sedang dalam perjalanan ke alamat Anda. Mohon siapkan penerimaan ya.`,
    completed: `Halo ${name}, terima kasih sudah belanja di wiwiksayur.com! Jika ada kendala dengan pesanan ${o.midtrans_order_id}, kabari kami maksimal 24 jam ya.`,
    pending: `Halo ${name}, pesanan ${o.midtrans_order_id} belum kami terima pembayarannya. Silakan selesaikan pembayaran ya.`,
    cancelled: `Halo ${name}, pesanan ${o.midtrans_order_id} telah dibatalkan. Hubungi kami bila ada pertanyaan.`,
  }[o.status];
  const next = NEXT[o.status];
  const locked = o.status === 'completed' || o.status === 'cancelled';

  return (
    <Modal title={o.midtrans_order_id} onClose={onClose} wide>
      <div className="flex items-center gap-2 mb-4"><Badge s={o.status} /><span className="text-xs text-slate-500">{o.created_at}</span>
        {Number(o.completed_order_count) >= 10 && <span className="px-2 py-0.5 rounded-full loyal-shimmer text-xs font-bold text-amber-950">Pelanggan Setia</span>}</div>

      <div className="rounded-xl border p-4 text-sm space-y-1">
        <p className="font-bold text-slate-900">{name}</p>
        {phone && <p className="text-slate-600">{phone}</p>}
        <p className="text-slate-600">{o.user_email}</p>
        <p className="pt-2 text-slate-800">{o.address}</p>
        {o.distance_km && <p className="text-xs text-slate-500">Jarak ± {o.distance_km} km</p>}
        {o.notes && <p className="pt-2 text-amber-800 bg-amber-50 rounded-lg px-3 py-2">Catatan: {o.notes}</p>}
        <div className="flex flex-wrap gap-2 pt-3">
          <a href={map} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm hover:bg-slate-50"><MapPin className="w-4 h-4" /> Buka Peta</a>
          {phone && <a href={waLink(phone, msg)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
          <button onClick={() => printSlip(o)} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm hover:bg-slate-50"><Printer className="w-4 h-4" /> Cetak Slip</button>
        </div>
      </div>

      <h4 className="font-bold mt-5 mb-2 text-slate-900">Barang yang dikemas</h4>
      <div className="rounded-xl border divide-y">
        {o.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 p-3">
            <img src={i.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-emerald-50" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{i.name}</p>
              <p className="text-xs text-slate-500">{formatRupiah(i.price)}/{i.unit}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-emerald-800">{fmtQty(i.quantity, i.unit)}</p>
              <p className="text-xs text-slate-500">{formatRupiah(lineTotal(i.price, i.quantity))}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(o.subtotal)}</span></div>
        <div className="flex justify-between"><span>Ongkir</span><span>{formatRupiah(o.delivery_fee)}</span></div>
        {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-700"><span>Diskon {o.voucher_code || ''}</span><span>-{formatRupiah(o.discount)}</span></div>}
        <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatRupiah(o.total)}</span></div>
      </div>

      {!locked && (
        <div className="mt-6 space-y-2">
          {next && <button disabled={busy} onClick={() => onStatus(o, next[0])} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">{next[1]}</button>}
          <button disabled={busy} onClick={() => { if (window.confirm(`Batalkan pesanan ${o.midtrans_order_id}? Stok akan dikembalikan bila sudah dibayar.`)) onStatus(o, 'cancelled'); }}
            className="w-full h-10 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50">Batalkan Pesanan</button>
        </div>
      )}
    </Modal>
  );
}

/* ---------- tab pesanan ---------- */
function OrdersTab({ orders, loading, reload, flash }) {
  const [filter, setFilter] = useState('paid');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => orders.reduce((a, o) => ({ ...a, [o.status]: (a[o.status] || 0) + 1 }), { all: orders.length }), [orders]);
  const list = orders.filter((o) => (filter === 'all' || o.status === filter) &&
    (!q || `${o.midtrans_order_id} ${o.customer_name || ''} ${o.user_name} ${o.customer_phone || ''} ${o.address}`.toLowerCase().includes(q.toLowerCase())));
  const open = orders.find((o) => o.order_id === openId);

  const setStatus = async (o, status) => {
    setBusy(true);
    try { await api.put(`/orders/${o.order_id}/status`, { status }); flash(`${o.midtrans_order_id}: ${ST[status].label}`); await reload(); if (status === 'completed' || status === 'cancelled') setOpenId(null); }
    catch (e) { flash(errMsg(e), true); }
    setBusy(false);
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filter === f ? 'bg-emerald-700 text-white' : 'bg-white border text-slate-700 hover:bg-emerald-50'}`}>
            {f === 'all' ? 'Semua' : ST[f].label} <span className={`ml-1 text-xs ${filter === f ? 'text-emerald-100' : 'text-slate-400'}`}>{counts[f] || 0}</span>
          </button>
        ))}
      </div>
      <div className="relative my-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari no. pesanan, nama, HP, alamat…" className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-sm" />
      </div>
      {loading && <p className="text-center text-slate-500 py-10">Memuat pesanan…</p>}
      {!loading && list.length === 0 && <p className="text-center text-slate-500 py-14">Tidak ada pesanan di kategori ini.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((o) => {
          const next = NEXT[o.status];
          return (
            <div key={o.order_id} className="bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow">
              <button className="w-full text-left" onClick={() => setOpenId(o.order_id)}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-mono text-xs text-slate-500">{o.midtrans_order_id}</p><p className="font-bold text-slate-900">{o.customer_name || o.user_name}</p></div>
                  <Badge s={o.status} />
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{o.items.map((i) => `${i.name} ${fmtQty(i.quantity, i.unit)}`).join(', ')}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{o.address}</p>
                <div className="flex items-center justify-between mt-3"><span className="text-xs text-slate-400">{timeAgo(o.created_at)}</span><span className="font-mono font-bold text-emerald-800">{formatRupiah(o.total)}</span></div>
              </button>
              {next && o.status !== 'pending' && <button disabled={busy} onClick={() => setStatus(o, next[0])} className="mt-3 w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">{next[1]}</button>}
            </div>
          );
        })}
      </div>
      {open && <OrderDetail o={open} onClose={() => setOpenId(null)} onStatus={setStatus} busy={busy} />}
    </div>
  );
}

/* ---------- dashboard ---------- */
function DashboardTab({ data }) {
  if (!data) return <p className="text-slate-500">Memuat…</p>;
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); const k = d.toISOString().slice(0, 10); const r = data.series.find((s) => String(s.d).slice(0, 10) === k); return { k, label: d.toLocaleDateString('id-ID', { weekday: 'short' }), r: Number(r?.r || 0), c: Number(r?.c || 0) }; });
  const max = Math.max(1, ...days.map((d) => d.r));
  const card = (t, v, sub, cls = 'bg-white') => <div className={`${cls} rounded-2xl border p-4`}><p className="text-xs text-slate-500">{t}</p><p className="text-2xl font-extrabold text-emerald-950 mt-1">{v}</p>{sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}</div>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {card('Perlu diproses', data.by_status.paid || 0, 'sudah dibayar', 'bg-amber-50')}
        {card('Omzet hari ini', formatRupiah(data.revenue_today), `${data.orders_today} pesanan`)}
        {card('Omzet bulan ini', formatRupiah(data.revenue_month))}
        {card('Pelanggan', data.total_customers, `${data.unread_messages} pesan baru`)}
      </div>
      <div className="bg-white rounded-2xl border p-4">
        <p className="font-bold text-slate-900 mb-4">Omzet 7 hari terakhir</p>
        <div className="flex items-end gap-2 h-40">
          {days.map((d) => (
            <div key={d.k} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] text-slate-500 mb-1">{d.r ? `${Math.round(d.r / 1000)}k` : ''}</span>
              <div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${Math.max(2, (d.r / max) * 100)}%` }} title={`${d.c} pesanan`} />
              <span className="text-[11px] text-slate-500 mt-1">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-4">
        <p className="font-bold text-slate-900 mb-2">Stok menipis</p>
        {data.low_stock.length === 0 ? <p className="text-sm text-slate-500">Semua stok aman.</p> :
          data.low_stock.map((p) => <div key={p.product_id} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span>{p.name}</span><span className={`font-mono font-bold ${Number(p.stock) <= 0 ? 'text-red-600' : 'text-amber-700'}`}>{Number(p.stock) <= 0 ? 'HABIS' : `${Number(p.stock)} ${p.unit}`}</span></div>)}
      </div>
    </div>
  );
}

/* ---------- produk ---------- */
const EMPTY_P = { name: '', category: 'Sayuran', price: '', unit: 'kg', stock: '', image_url: '', description: '' };
function ProductsTab({ flash }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => api.get('/admin/products').then((r) => setRows(r.data.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const p = { ...edit, price: Number(edit.price), stock: Number(edit.stock || 0) };
    if (!p.name || !p.price) return flash('Nama dan harga wajib diisi', true);
    try {
      if (p.product_id) await api.put(`/products/${p.product_id}`, p); else await api.post('/products', p);
      flash('Produk disimpan'); setEdit(null); load();
    } catch (e) { flash(errMsg(e), true); }
  };
  const quick = async (p, patch) => { try { await api.put(`/products/${p.product_id}`, patch); load(); } catch (e) { flash(errMsg(e), true); } };
  const f = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  const inp = 'w-full h-10 px-3 rounded-lg border text-sm bg-white';

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk…" className={`${inp} pl-9`} /></div>
        <button onClick={() => setEdit({ ...EMPTY_P })} className="px-4 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Produk</button>
      </div>
      <div className="grid gap-2">
        {rows.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
          <div key={p.product_id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${Number(p.is_active) ? '' : 'opacity-50'}`}>
            <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-cover bg-emerald-50" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-xs text-slate-500">{p.category} · {formatRupiah(p.price)}/{p.unit}</p>
            </div>
            <label className="text-xs text-slate-500 text-center">Stok
              <input defaultValue={Number(p.stock)} key={p.stock} type="number" min="0" step="any" onBlur={(e) => Number(e.target.value) !== Number(p.stock) && quick(p, { stock: Number(e.target.value) })} className="block w-20 h-9 px-2 rounded-lg border text-sm text-center font-mono text-slate-900" />
            </label>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEdit(p)} className="text-xs px-2.5 py-1 rounded-md border hover:bg-slate-50">Edit</button>
              <button onClick={() => quick(p, { is_active: Number(p.is_active) ? 0 : 1 })} className="text-xs px-2.5 py-1 rounded-md border hover:bg-slate-50">{Number(p.is_active) ? 'Sembunyikan' : 'Tampilkan'}</button>
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <Modal title={edit.product_id ? 'Edit Produk' : 'Produk Baru'} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <input className={inp} placeholder="Nama produk" value={edit.name} onChange={f('name')} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inp} list="cats" placeholder="Kategori" value={edit.category || ''} onChange={f('category')} />
              <datalist id="cats"><option>Sayuran</option><option>Buah-buahan</option><option>Bumbu Dapur</option><option>Rempah</option><option>Organik</option></datalist>
              <select className={inp} value={edit.unit} onChange={f('unit')}>{['kg', 'ikat', 'buah', 'sisir', 'pack', '500g'].map((u) => <option key={u}>{u}</option>)}</select>
              <input className={inp} type="number" placeholder="Harga per satuan" value={edit.price} onChange={f('price')} />
              <input className={inp} type="number" step="any" placeholder="Stok" value={edit.stock} onChange={f('stock')} />
            </div>
            <p className="text-xs text-slate-500">Satuan <b>kg</b> = pembeli memilih berat (250 g, 500 g, dst.), harga dihitung proporsional.</p>
            <input className={inp} placeholder="Link gambar (https://…)" value={edit.image_url || ''} onChange={f('image_url')} />
            <textarea className={`${inp} h-24 py-2`} placeholder="Deskripsi (opsional)" value={edit.description || ''} onChange={f('description')} />
            <button onClick={save} className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Simpan</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- voucher ---------- */
function VouchersTab({ flash }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const load = useCallback(() => api.get('/vouchers').then((r) => setRows(r.data.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const inp = 'w-full h-10 px-3 rounded-lg border text-sm bg-white';
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => {
    if (!form.code || !form.value) return flash('Kode dan nilai wajib diisi', true);
    try {
      await api.post('/vouchers', { ...form, code: form.code.toUpperCase().trim(), value: Number(form.value), max_discount: Number(form.max_discount) || null, min_spend: Number(form.min_spend) || 0, quota: Number(form.quota) || 0, expires_at: form.expires_at ? `${form.expires_at} 23:59:59` : null });
      flash('Voucher dibuat'); setForm(null); load();
    } catch (e) { flash(errMsg(e), true); }
  };
  const toggle = async (v) => { await api.put(`/vouchers/${v.voucher_id}`, { is_active: !Number(v.is_active) }); load(); };
  return (
    <div>
      <button onClick={() => setForm({ code: '', type: 'percentage', value: '', max_discount: '', min_spend: '', quota: '', expires_at: '' })} className="mb-3 px-4 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Voucher</button>
      <div className="grid gap-2 lg:grid-cols-2">
        {rows.map((v) => (
          <div key={v.voucher_id} className={`bg-white rounded-xl border p-4 ${Number(v.is_active) ? '' : 'opacity-50'}`}>
            <div className="flex justify-between items-start">
              <div><p className="font-mono font-extrabold text-emerald-800">{v.code}</p>
                <p className="text-sm">{v.type === 'percentage' ? `Diskon ${Number(v.value)}%${Number(v.max_discount) ? ` (maks ${formatRupiah(v.max_discount)})` : ''}` : `Potongan ${formatRupiah(v.value)}`}</p></div>
              <button onClick={() => toggle(v)} className="text-xs px-2.5 py-1 rounded-md border hover:bg-slate-50">{Number(v.is_active) ? 'Nonaktifkan' : 'Aktifkan'}</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Min. belanja {formatRupiah(v.min_spend)} · terpakai {v.used_count}{Number(v.quota) ? `/${v.quota}` : ''}{v.expires_at ? ` · s/d ${String(v.expires_at).slice(0, 10)}` : ''}</p>
          </div>
        ))}
      </div>
      {form && (
        <Modal title="Voucher Baru" onClose={() => setForm(null)}>
          <div className="space-y-3">
            <input className={inp} placeholder="Kode (mis. HEMAT10)" value={form.code} onChange={f('code')} />
            <select className={inp} value={form.type} onChange={f('type')}><option value="percentage">Persen (%)</option><option value="fixed">Potongan Rupiah</option></select>
            <input className={inp} type="number" placeholder={form.type === 'percentage' ? 'Persen diskon' : 'Nominal potongan'} value={form.value} onChange={f('value')} />
            {form.type === 'percentage' && <input className={inp} type="number" placeholder="Maks. diskon (Rp)" value={form.max_discount} onChange={f('max_discount')} />}
            <input className={inp} type="number" placeholder="Minimal belanja (Rp)" value={form.min_spend} onChange={f('min_spend')} />
            <input className={inp} type="number" placeholder="Kuota (kosong = tanpa batas)" value={form.quota} onChange={f('quota')} />
            <label className="text-xs text-slate-500">Berlaku sampai<input className={inp} type="date" value={form.expires_at} onChange={f('expires_at')} /></label>
            <button onClick={save} className="w-full h-11 rounded-lg bg-emerald-600 text-white font-semibold">Simpan</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- pesan ---------- */
function MessagesTab({ flash }) {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get('/admin/messages').then((r) => setRows(r.data.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const read = async (m) => { await api.put(`/admin/messages/${m.id}`); flash('Ditandai dibaca'); load(); };
  return (
    <div className="grid gap-2">
      {rows.length === 0 && <p className="text-center text-slate-500 py-12">Belum ada pesan.</p>}
      {rows.map((m) => (
        <div key={m.id} className={`rounded-xl border p-4 ${Number(m.is_read) ? 'bg-white' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex justify-between gap-2"><p className="font-bold text-sm">{m.name} <span className="font-normal text-slate-500">· {m.email}</span></p><span className="text-xs text-slate-400">{timeAgo(m.created_at)}</span></div>
          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{m.message}</p>
          <div className="flex gap-2 mt-3">
            {m.phone && <a href={waLink(m.phone, `Halo ${m.name}, terima kasih sudah menghubungi wiwiksayur.com.`)} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white">Balas WhatsApp</a>}
            <a href={`mailto:${m.email}`} className="text-xs px-3 py-1.5 rounded-md border">Balas Email</a>
            {!Number(m.is_read) && <button onClick={() => read(m)} className="text-xs px-3 py-1.5 rounded-md border ml-auto">Tandai dibaca</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- ongkir & lokasi toko ---------- */
const num = (v) => Number(String(v).replace(',', '.'));

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-800 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

function ShippingTab({ flash }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sim, setSim] = useState({ subtotal: '300000', km: '2' });
  const inp = 'h-10 px-3 rounded-lg border text-sm bg-white w-full';

  useEffect(() => {
    api.get('/shipping/config').then((r) => {
      const c = r.data.data;
      setForm({
        store_lat: String(c.store_lat), store_lng: String(c.store_lng),
        max_radius_km: String(c.max_radius_km),
        base_km: String(c.base_km), base_fee: String(c.base_fee), per_km_fee: String(c.per_km_fee),
        free_enabled: !!c.free_enabled,
        free_tiers: (c.free_tiers || []).map((t) => ({ min_spend: String(t.min_spend), max_km: String(t.max_km) })),
      });
    }).catch(() => flash('Gagal memuat pengaturan ongkir', true));
  }, []);

  const lat = form ? num(form.store_lat) : NaN;
  const lng = form ? num(form.store_lng) : NaN;
  const pos = useMemo(() => (Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null), [lat, lng]);
  const radius = form ? num(form.max_radius_km) : 0;
  const circle = useMemo(() => (pos && radius > 0 ? { center: pos, radiusKm: radius } : null), [pos, radius]);

  if (!form) return <p className="text-slate-500">Memuat…</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setTier = (i, k) => (e) => setForm({ ...form, free_tiers: form.free_tiers.map((t, j) => (j === i ? { ...t, [k]: e.target.value } : t)) });
  const addTier = () => setForm({ ...form, free_tiers: [...form.free_tiers, { min_spend: '300000', max_km: '3' }] });
  const delTier = (i) => setForm({ ...form, free_tiers: form.free_tiers.filter((_, j) => j !== i) });
  const moveStore = (p) => setForm({ ...form, store_lat: p.lat.toFixed(6), store_lng: p.lng.toFixed(6) });

  const toPayload = () => ({
    store_lat: num(form.store_lat), store_lng: num(form.store_lng),
    max_radius_km: num(form.max_radius_km || 0),
    base_km: num(form.base_km), base_fee: num(form.base_fee), per_km_fee: num(form.per_km_fee),
    free_enabled: form.free_enabled,
    free_tiers: form.free_tiers.map((t) => ({ min_spend: num(t.min_spend), max_km: num(t.max_km) })),
  });

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/shipping/config', toPayload());
      flash('Pengaturan ongkir disimpan');
    } catch (e) { flash(errMsg(e), true); }
    setSaving(false);
  };

  // simulasi memakai nilai yang sedang diisi (belum perlu disimpan)
  const simCfg = toPayload();
  const simKm = num(sim.km); const simSub = num(sim.subtotal);
  const simOk = [simKm, simSub].every(Number.isFinite) && simCfg.free_tiers.every((t) => Number.isFinite(t.min_spend) && Number.isFinite(t.max_km)) && [simCfg.base_km, simCfg.base_fee, simCfg.per_km_fee].every(Number.isFinite);
  const outOfRange = simOk && simCfg.max_radius_km > 0 && simKm > simCfg.max_radius_km;

  return (
    <div className="grid gap-5 lg:grid-cols-2 items-start">
      <div className="space-y-5">
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Gratis ongkir</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.free_enabled} onChange={(e) => setForm({ ...form, free_enabled: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
            Aktifkan gratis ongkir
          </label>
          <p className="text-xs text-slate-500">
            Pembeli gratis ongkir bila total belanja mencapai minimal tertentu <em>dan</em> lokasinya dalam jarak lurus (radius) dari toko.
            Contoh: belanja minimal Rp 300.000 dan jarak 0–3 km. Bila ada beberapa aturan, cukup satu yang terpenuhi.
          </p>
          <div className={`space-y-2 ${form.free_enabled ? '' : 'opacity-50 pointer-events-none'}`}>
            {form.free_tiers.length === 0 && <p className="text-sm text-slate-500">Belum ada aturan. Tambahkan satu di bawah.</p>}
            {form.free_tiers.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border bg-slate-50 p-3 text-sm">
                <span className="text-slate-600">Belanja minimal Rp</span>
                <input className={`${inp} !w-32`} type="number" min="0" step="1000" value={t.min_spend} onChange={setTier(i, 'min_spend')} aria-label="Minimal belanja (Rp)" />
                <span className="text-slate-600">dan jarak 0 sampai</span>
                <input className={`${inp} !w-20`} type="number" min="0" step="0.1" value={t.max_km} onChange={setTier(i, 'max_km')} aria-label="Jarak maksimal (km)" />
                <span className="text-slate-600">km</span>
                <button type="button" onClick={() => delTier(i)} aria-label="Hapus aturan" className="ml-auto p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addTier} className="px-3 h-9 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5 hover:bg-slate-50"><Plus className="w-4 h-4" /> Tambah aturan</button>
          </div>
        </section>

        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Tarif ongkir</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tarif dasar (Rp)"><input className={inp} type="number" min="0" step="500" value={form.base_fee} onChange={set('base_fee')} /></Field>
            <Field label="Berlaku sampai jarak (km)"><input className={inp} type="number" min="0" step="0.5" value={form.base_km} onChange={set('base_km')} /></Field>
          </div>
          <Field label="Tambahan per km berikutnya (Rp)" hint="Jarak lebih dari tarif dasar dibulatkan ke atas per km."><input className={inp} type="number" min="0" step="500" value={form.per_km_fee} onChange={set('per_km_fee')} /></Field>
          <Field label="Jangkauan pengiriman maksimal (km)" hint="Isi 0 bila tidak dibatasi. Pembeli di luar jarak ini tidak bisa memesan.">
            <input className={inp} type="number" min="0" step="0.5" value={form.max_radius_km} onChange={set('max_radius_km')} />
          </Field>
        </section>

        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Coba hitung</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total belanja (Rp)"><input className={inp} type="number" min="0" step="10000" value={sim.subtotal} onChange={(e) => setSim({ ...sim, subtotal: e.target.value })} /></Field>
            <Field label="Jarak dari toko (km)"><input className={inp} type="number" min="0" step="0.1" value={sim.km} onChange={(e) => setSim({ ...sim, km: e.target.value })} /></Field>
          </div>
          <p className="text-sm rounded-lg bg-slate-50 border px-3 py-2">
            {!simOk ? 'Lengkapi semua isian dulu.'
              : outOfRange ? <span className="text-red-600 font-semibold">Di luar jangkauan pengiriman.</span>
              : isFree(simCfg, simKm, simSub) ? <span className="text-emerald-700 font-semibold">Gratis ongkir</span>
              : <>Ongkir <strong>{formatRupiah(calcFee(simCfg, simKm, simSub))}</strong></>}
          </p>
        </section>

        <button onClick={save} disabled={saving} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50">
          {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
        </button>
      </div>

      <section className="bg-white rounded-xl border p-4 space-y-3 lg:sticky lg:top-20">
        <h3 className="font-bold text-slate-900">Lokasi toko</h3>
        <p className="text-xs text-slate-500">Geser pin atau klik peta untuk memindahkan lokasi toko. Jarak ke pembeli dihitung dari titik ini.</p>
        <div className="h-72 rounded-lg overflow-hidden border">
          <GoogleMapComponent pin={pos} onPinChange={moveStore} onMapClick={moveStore} circle={circle} zoom={13} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"><input className={inp} inputMode="decimal" value={form.store_lat} onChange={set('store_lat')} /></Field>
          <Field label="Longitude"><input className={inp} inputMode="decimal" value={form.store_lng} onChange={set('store_lng')} /></Field>
        </div>
        {pos && <a href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline"><MapPin className="w-4 h-4" /> Buka di Google Maps</a>}
      </section>
    </div>
  );
}

/* ---------- halaman utama admin ---------- */
const TABS = [
  ['orders', 'Pesanan', ClipboardList], ['dashboard', 'Ringkasan', LayoutDashboard], ['products', 'Produk', Package],
  ['vouchers', 'Voucher', Ticket], ['shipping', 'Ongkir', Truck], ['messages', 'Pesan', MessageSquare],
];

export default function Admin() {
  const { user, logout } = useAppContext();
  const nav = useNavigate();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [toast, setToast] = useState(null);
  const [sound, setSound] = useState(true);
  const [waited, setWaited] = useState(false);
  const maxId = useRef(null);

  const flash = (msg, bad) => { setToast({ msg, bad }); setTimeout(() => setToast(null), 2600); };

  const reload = useCallback(async () => {
    try {
      const [o, d] = await Promise.all([api.get('/admin/orders'), api.get('/admin/dashboard')]);
      const list = o.data.data;
      const top = list.reduce((m, x) => Math.max(m, Number(x.order_id)), 0);
      if (maxId.current !== null && top > maxId.current) { const n = list.filter((x) => Number(x.order_id) > maxId.current).length; flash(`🔔 ${n} pesanan baru masuk`); if (sound) beep(); }
      maxId.current = top;
      setOrders(list); setDash(d.data.data);
    } catch (e) { /* diam: coba lagi pada polling berikutnya */ }
    setLoading(false);
  }, [sound]);

  const isAdmin = user?.role === 'admin';
  useEffect(() => { if (!isAdmin) return; reload(); const t = setInterval(reload, 20000); return () => clearInterval(t); }, [isAdmin, reload]);
  useEffect(() => { const t = setTimeout(() => setWaited(true), 3500); return () => clearTimeout(t); }, []);
  const pending = orders.filter((o) => o.status === 'paid').length;
  useEffect(() => { document.title = pending ? `(${pending}) Pesanan baru | Admin` : 'Admin | wiwiksayur.com'; }, [pending]);

  if (!isAdmin) {
    if (!user && !waited) return <p className="p-10 text-center text-slate-500">Memuat…</p>;
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div><p className="text-lg font-bold mb-2">Halaman khusus admin</p>
          <p className="text-slate-600 mb-4">{user ? 'Akun Anda tidak memiliki akses admin.' : 'Silakan masuk dengan akun admin.'}</p>
          <button onClick={() => nav(user ? '/' : '/auth')} className="px-5 h-10 rounded-lg bg-emerald-600 text-white">{user ? 'Ke Toko' : 'Masuk'}</button></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-emerald-950 text-emerald-50 p-4 sticky top-0 h-screen">
        <p className="font-extrabold text-lg px-2 py-3 flex items-center gap-2"><Logo className="w-8 h-8" /> <span className="text-emerald-400">.id</span> <span className="text-xs font-normal text-emerald-300">admin</span></p>
        <nav className="mt-2 space-y-1 flex-1">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm ${tab === k ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-900'}`}>
              <Icon className="w-4 h-4" /> {label}
              {k === 'orders' && pending > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold rounded-full px-2">{pending}</span>}
              {k === 'messages' && dash?.unread_messages > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold rounded-full px-2">{dash.unread_messages}</span>}
            </button>
          ))}
        </nav>
        <Link to="/" className="flex items-center gap-3 px-3 h-10 rounded-lg text-sm hover:bg-emerald-900"><Store className="w-4 h-4" /> Lihat Toko</Link>
        <button onClick={() => { logout(); nav('/'); }} className="flex items-center gap-3 px-3 h-10 rounded-lg text-sm hover:bg-emerald-900"><LogOut className="w-4 h-4" /> Keluar</button>
      </aside>

      <div className="flex-1 min-w-0 pb-20 md:pb-8">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b px-4 md:px-8 h-14 flex items-center gap-3">
          <h1 className="font-bold text-slate-900">{TABS.find((t) => t[0] === tab)[1]}</h1>
          <div className="flex-1" />
          <button onClick={() => setSound(!sound)} title="Bunyi notifikasi" className={`p-2 rounded-lg border ${sound ? 'text-emerald-700' : 'text-slate-400'}`}><Bell className="w-4 h-4" /></button>
          <button onClick={reload} title="Muat ulang" className="p-2 rounded-lg border"><RefreshCw className="w-4 h-4" /></button>
          <Link to="/" className="md:hidden p-2 rounded-lg border"><Store className="w-4 h-4" /></Link>
        </header>
        <main className="p-4 md:p-8 max-w-6xl">
          {tab === 'orders' && <OrdersTab orders={orders} loading={loading} reload={reload} flash={flash} />}
          {tab === 'dashboard' && <DashboardTab data={dash} />}
          {tab === 'products' && <ProductsTab flash={flash} />}
          {tab === 'vouchers' && <VouchersTab flash={flash} />}
          {tab === 'shipping' && <ShippingTab flash={flash} />}
          {tab === 'messages' && <MessagesTab flash={flash} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t grid grid-cols-6">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative flex flex-col items-center py-2 text-[11px] ${tab === k ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
            <Icon className="w-5 h-5" />{label}
            {k === 'orders' && pending > 0 && <span className="absolute top-1 right-[22%] bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 grid place-items-center">{pending}</span>}
          </button>
        ))}
      </nav>

      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] toast-in rounded-xl text-white text-sm px-4 py-3 shadow-lg ${toast.bad ? 'bg-red-600' : 'bg-emerald-900'}`}>{toast.msg}</div>}
    </div>
  );
}
