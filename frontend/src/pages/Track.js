import React from 'react';
import { useParams } from 'react-router-dom';
import GoogleMapComponent from '../components/GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Package, CheckCircle2, Truck } from 'lucide-react';

export default function Track() {
  const { orderId } = useParams();
  
  const origin = { lat: -6.200000, lng: 106.816666 }; // Store
  const destination = { lat: -6.210000, lng: 106.820000 }; // Customer

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Lacak Pesanan</h1>
      <p className="text-gray-500 mb-8">Order ID: {orderId}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Peta Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
                <GoogleMapComponent markers={[origin, destination]} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-emerald-50">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">Pesanan Diterima</div>
                      <time className="text-xs font-medium text-emerald-600">09:00</time>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-emerald-50">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">Dikemas</div>
                      <time className="text-xs font-medium text-emerald-600">09:30</time>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-blue-200 shadow-sm bg-blue-50">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">Dalam Perjalanan</div>
                      <time className="text-xs font-medium text-blue-600">10:15</time>
                    </div>
                    <div className="text-sm text-slate-500 mt-2">Kurir: Budi (0812345678)</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white opacity-50">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">Tiba di Tujuan</div>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
