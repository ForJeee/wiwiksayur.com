import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function PaymentResult() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get('status');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-10 text-center">
          {isSuccess ? (
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-emerald-100 p-3 mb-6">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-500 mb-8">
                Terima kasih atas pesanan Anda. Kami sedang memproses pesanan dan akan segera mengirimkannya.
              </p>
              <div className="space-y-3 w-full">
                <Link to="/profile">
                  <Button className="w-full">Lihat Pesanan Saya</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">Kembali Belanja</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-red-100 p-3 mb-6">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Gagal</h1>
              <p className="text-gray-500 mb-8">
                Maaf, terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi.
              </p>
              <div className="space-y-3 w-full">
                <Link to="/checkout">
                  <Button className="w-full">Coba Lagi</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
