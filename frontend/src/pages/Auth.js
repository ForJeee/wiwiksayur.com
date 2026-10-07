import React, { useEffect, useRef, useState } from 'react';
import Logo from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppContext();
  const navigate = useNavigate();
  const googleBtn = useRef(null);

  const finishLogin = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    navigate(data.user.role === 'admin' ? '/admin' : '/');
  };

  const handleGoogle = async (response) => {
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      finishLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login Google gagal. Coba lagi.');
    }
  };

  // Muat tombol "Masuk dengan Google" (Google Identity Services)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const render = () => {
      if (!window.google || !googleBtn.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogle });
      window.google.accounts.id.renderButton(googleBtn.current, {
        theme: 'outline', size: 'large', text: isLogin ? 'signin_with' : 'signup_with', width: 320, locale: 'id',
      });
    };
    if (window.google) { render(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = render;
    document.body.appendChild(s);
    // eslint-disable-next-line
  }, [isLogin]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!isLogin) {
        await api.post('/auth/register', { name: form.name, email: form.email, phone: form.phone, password: form.password });
      }
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      finishLogin(res.data);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(
        msg === 'Email already exists' ? 'Email sudah terdaftar. Silakan masuk.' :
        msg === 'Invalid credentials' ? 'Email atau kata sandi salah.' :
        msg || 'Terjadi kesalahan. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Logo className="w-14 h-14" /></div>
          <CardTitle className="text-2xl font-bold text-primary">WiwikSayur.com</CardTitle>
          <CardDescription>{isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}</CardDescription>
        </CardHeader>
        <CardContent>
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex justify-center" ref={googleBtn} />
              <div className="flex items-center my-4 text-xs text-gray-400">
                <div className="flex-1 border-t" /><span className="px-3">atau dengan email</span><div className="flex-1 border-t" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input required value={form.name} onChange={set('name')} placeholder="Masukkan nama" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">No. HP</label>
                  <Input required type="tel" value={form.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input required type="email" value={form.email} onChange={set('email')} placeholder="nama@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kata Sandi</label>
              <Input required type="password" minLength={6} value={form.password} onChange={set('password')} placeholder="Minimal 6 karakter" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
            </Button>
            {!isLogin && (
              <p className="text-xs text-gray-500 text-center">
                Dengan mendaftar, Anda menyetujui <a href="/syarat-ketentuan" className="underline">Syarat & Ketentuan</a> dan <a href="/kebijakan-privasi" className="underline">Kebijakan Privasi</a>.
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-500">{isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}</span>
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary hover:underline font-medium">
              {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
