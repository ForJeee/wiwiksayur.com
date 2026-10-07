import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatRupiah, api } from '../lib/utils';
import { LogOut, Package, User } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const STATUS = { pending: 'Menunggu Bayar', paid: 'Dibayar', processing: 'Diproses', shipping: 'Dikirim', completed: 'Selesai', cancelled: 'Dibatalkan' };

  useEffect(() => {
    if (!user) return;
    api.get('/orders')
      .then((res) => setOrders((res.data.data || []).map((o) => ({
        id: o.midtrans_order_id || String(o.order_id),
        date: String(o.created_at).slice(0, 10),
        total: Number(o.total),
        status: STATUS[o.status] || o.status,
      }))))
      .catch(() => {});
    // eslint-disable-next-line
  }, [user]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    setUser(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-gray-600 mb-4">Silakan masuk untuk melihat profil Anda.</p>
        <Button onClick={() => navigate('/auth')}>Masuk</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Button variant="outline" className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Riwayat Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{order.id}</span>
                          <Badge variant={order.status === 'Selesai' ? 'default' : 'secondary'}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{order.date}</p>
                      </div>
                      <div className="text-right w-full sm:w-auto">
                        <p className="text-sm text-gray-500 mb-1">Total Belanja</p>
                        <p className="font-mono font-bold text-primary">{formatRupiah(order.total)}</p>
                        {order.status === 'Dikirim' && (
                          <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" onClick={() => navigate(`/track/${order.id}`)}>
                            Lacak Pesanan
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada riwayat pesanan.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
