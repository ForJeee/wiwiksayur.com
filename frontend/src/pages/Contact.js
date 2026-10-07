import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import GoogleMapComponent from '../components/GoogleMap';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Contact() {
  const storeLocation = { lat: -6.200000, lng: 106.816666 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Hubungi Kami</h1>
        <p className="mt-4 text-lg text-gray-500">Punya pertanyaan atau masukan? Jangan ragu untuk menghubungi tim kami.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Alamat Toko</h3>
                <p className="mt-1 text-gray-500">Jl. Palmerah Sel. No.145 4, RT.4/RW.2, Gelora, Kecamatan Tanah Abang, Kota Jakarta Pusat<br />Daerah Khusus Ibukota Jakarta 10270</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Telepon & WhatsApp</h3>
                <p className="mt-1 text-gray-500">0858-1442-0843<br /></p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email</h3>
                <p className="mt-1 text-gray-500">cs@wiwiksayur.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Jam Operasional</h3>
                <p className="mt-1 text-gray-500">Senin - Minggu: 04.00 - 00.00</p>
              </div>
            </div>
          </div>

          <div className="mt-12 h-64 rounded-lg overflow-hidden border border-gray-200">
            <GoogleMapComponent center={storeLocation} markers={[storeLocation]} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h3>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <Input type="text" id="name" className="mt-1" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <Input type="email" id="email" className="mt-1" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subjek</label>
              <Input type="text" id="subject" className="mt-1" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Pesan</label>
              <textarea id="message" rows={4} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <Button type="submit" className="w-full">Kirim Pesan</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
