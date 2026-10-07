import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
            <span className="block">Sayuran & Buah Fresh</span>
            <span className="block text-emerald-300">Langsung ke Dapur Anda</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-emerald-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Menyediakan Sayuran & Buah Fresh, segar dari petani untuk kesehatan keluarga Anda. Pesan sekarang, antar hari ini.
          </p>
          <div className="mt-8 max-w-xl mx-auto flex">
            <Input
              type="text"
              placeholder="Cari sayuran, buah, bumbu..."
              className="rounded-l-md rounded-r-none border-0 focus-visible:ring-emerald-500 h-12 text-base"
            />
            <Button className="rounded-l-none rounded-r-md h-12 px-6" variant="default">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
    </div>
  );
}
