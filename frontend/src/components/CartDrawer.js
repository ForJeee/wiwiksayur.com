import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatRupiah } from '../lib/utils';
import { fmtQty, lineTotal } from '../lib/qty';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal, user } = useAppContext();
  const nav = useNavigate();
  if (!isCartOpen) return null;

  const goCheckout = () => {
    setIsCartOpen(false);
    nav(user ? '/checkout' : '/auth?next=/checkout');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-xl flex flex-col p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-950"><ShoppingBag className="w-5 h-5" /> Keranjang ({cart.length})</h2>
          <button onClick={() => setIsCartOpen(false)} aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-4 space-y-3">
          {cart.length === 0 && <p className="text-center text-slate-500 py-16">Keranjang kosong</p>}
          {cart.map((i) => {
            const step = i.unit === 'kg' ? 0.25 : 1;
            return (
              <div key={i.id} className="flex gap-3 p-3 rounded-xl border border-emerald-900/10 bg-white">
                <img src={i.image} alt={i.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{i.name}</p>
                  <p className="text-xs text-slate-500">{formatRupiah(i.price)}/{i.unit}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(i.id, i.quantity - step)} className="w-7 h-7 rounded-full border border-emerald-200 grid place-items-center hover:bg-emerald-50"><Minus className="w-3 h-3" /></button>
                    <span className="font-mono min-w-[3.5rem] text-center text-sm">{fmtQty(i.quantity, i.unit)}</span>
                    <button onClick={() => updateQuantity(i.id, i.quantity + step)} className="w-7 h-7 rounded-full border border-emerald-200 grid place-items-center hover:bg-emerald-50"><Plus className="w-3 h-3" /></button>
                    <span className="ml-auto text-sm font-mono font-bold text-emerald-700">{formatRupiah(lineTotal(i.price, i.quantity))}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(i.id)} aria-label="Hapus" className="text-slate-400 hover:text-red-500 self-start"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between font-semibold text-emerald-950"><span>Subtotal</span><span className="font-mono">{formatRupiah(subtotal)}</span></div>
          <button disabled={cart.length === 0} onClick={goCheckout} className="w-full h-12 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold disabled:opacity-50">Lanjut ke Checkout</button>
        </div>
      </div>
    </>
  );
}
