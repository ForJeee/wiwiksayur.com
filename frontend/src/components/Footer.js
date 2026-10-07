import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { STORE } from '../data/policies';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-50 mt-16">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={`${process.env.PUBLIC_URL}/favicon.png`}
                alt="WiwikSayur.com"
                className="w-11 h-11 rounded-xl bg-white p-1 object-contain"
              />
            <span className="font-bold text-2xl tracking-tight text-white">Wiwiksayur.com</span>
            </div>
            <p className="mt-2 text-sm text-emerald-200">
              Suplier Sayur & Buah Fresh - Segar dari Petani, Langsung ke Dapur Anda
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-emerald-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-emerald-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-emerald-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wider uppercase">Menu Cepat</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/" className="text-emerald-200 hover:text-white">Beranda</Link></li>
              <li><Link to="/tentang-kami" className="text-emerald-200 hover:text-white">Tentang Kami</Link></li>
              <li><Link to="/kontak" className="text-emerald-200 hover:text-white">Kontak</Link></li>
              <li><Link to="/auth" className="text-emerald-200 hover:text-white">Masuk / Daftar</Link></li>
              <li><Link to="/syarat-ketentuan" className="text-emerald-200 hover:text-white">Syarat & Ketentuan</Link></li>
              <li><Link to="/kebijakan-privasi" className="text-emerald-200 hover:text-white">Kebijakan Privasi</Link></li>
              <li><Link to="/refund-pembatalan" className="text-emerald-200 hover:text-white">Refund & Pembatalan</Link></li>
              <li><Link to="/pengiriman" className="text-emerald-200 hover:text-white">Kebijakan Pengiriman</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wider uppercase">Kontak Kami</h3>
            <ul className="mt-4 space-y-2 text-sm text-emerald-200">
              <li>{STORE.address}</li>
              <li>Telepon/WhatsApp: {STORE.phone}</li>
              <li>Email: {STORE.email}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-emerald-800 pt-8 flex items-center justify-between">
          <p className="text-base text-emerald-400">
            &copy; {new Date().getFullYear()} wiwiksayur.com. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
