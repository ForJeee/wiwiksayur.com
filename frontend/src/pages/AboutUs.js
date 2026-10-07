import React from 'react';

export default function AboutUs() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Tentang Kami</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            wiwiksayur.com
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Menyediakan Sayuran & Buah Fresh - Segar dari Petani, Langsung ke Dapur Anda
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
              Cerita Kami
            </h3>
            <p className="mt-4 text-lg text-gray-500">
              Bermula dari keinginan untuk menyediakan bahan pangan berkualitas dengan harga terjangkau, wiwiksayur.com hadir sebagai jembatan antara petani lokal dan keluarga Indonesia. Kami percaya bahwa setiap keluarga berhak mendapatkan akses ke sayuran dan buah segar yang tidak hanya lezat tapi juga menyehatkan.
            </p>
            <p className="mt-4 text-lg text-gray-500">
              Dengan sistem rantai pasok yang efisien, kami memastikan hasil panen dipetik di pagi hari dan sampai di dapur Anda dalam keadaan paling segar.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-xl">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800" alt="Sayuran segar" className="w-full h-auto object-cover" />
          </div>
        </div>

        <div className="mt-24">
          <h3 className="text-2xl font-extrabold text-center text-gray-900 tracking-tight sm:text-3xl mb-12">
            Nilai-nilai Kami
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">1</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Kesegaran Terjamin</h4>
              <p className="text-gray-600">Produk dipanen langsung dan disortir ketat untuk memastikan kualitas terbaik.</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">2</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Pemberdayaan Petani</h4>
              <p className="text-gray-600">Bermitra langsung dengan petani lokal dengan harga beli yang adil.</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">3</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Layanan Sepenuh Hati</h4>
              <p className="text-gray-600">Pengiriman cepat dan garansi uang kembali jika produk tidak sesuai standar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
