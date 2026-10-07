import React, { useState } from 'react';
import Logo from './Logo';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Award, LayoutDashboard, Leaf } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Navbar() {
  const { user, cart, setIsCartOpen, logout } = useAppContext();
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();
  const setia = user && Number(user.completed_order_count) >= 10;
  const go = (p) => { setMenu(false); nav(p); };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-emerald-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-extrabold tracking-tight text-emerald-950 text-lg">wiwiksayur<span className="text-emerald-600">.com</span></span>
        </Link>
        <nav className="ml-6 hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-emerald-700">Belanja</Link>
          <Link to="/tentang-kami" className="hover:text-emerald-700">Tentang Kami</Link>
          <Link to="/kontak" className="hover:text-emerald-700">Kontak</Link>
          {user && <Link to="/profile" className="hover:text-emerald-700">Pesanan Saya</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-emerald-700 flex items-center gap-1"><LayoutDashboard className="w-4 h-4" /> Admin</Link>}
        </nav>
        <div className="flex-1" />
        <button onClick={() => setIsCartOpen(true)} aria-label="Buka keranjang" className="relative rounded-full p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition">
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">{cart.length}</span>}
        </button>
        {user ? (
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-emerald-900/10 hover:bg-emerald-50 transition">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-xs font-bold grid place-items-center">{(user.name || user.email || '?')[0]?.toUpperCase()}</div>
              <span className="text-sm font-medium text-slate-800 hidden sm:inline">{user.name?.split(' ')[0] || 'Akun'}</span>
              {setia && <Award className="w-4 h-4 text-amber-500" />}
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl bg-white border border-emerald-900/10 shadow-lg p-1 text-sm">
                  <div className="px-3 py-2 text-xs text-slate-500">
                    {user.email}
                    {setia && <span className="block mt-1 w-fit px-2 py-0.5 rounded-full loyal-shimmer text-amber-950 font-semibold">Pelanggan Setia</span>}
                  </div>
                  <button onClick={() => go('/profile')} className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-emerald-50"><User className="w-4 h-4 mr-2" /> Profil & Pesanan</button>
                  {user.role === 'admin' && <button onClick={() => go('/admin')} className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-emerald-50"><LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard</button>}
                  <button onClick={() => { setMenu(false); logout(); nav('/'); }} className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"><LogOut className="w-4 h-4 mr-2" /> Keluar</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => nav('/auth')} className="px-4 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">Masuk</button>
        )}
      </div>
    </header>
  );
}
