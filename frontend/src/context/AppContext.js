import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/utils';
import { fmtQty, lineTotal } from '../lib/qty';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
  });
  const [toast, setToast] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Semua']);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // Muat sesi login dari token yang tersimpan
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('token'));
  }, []);

  // Muat produk dari database (data bawaan di atas dipakai bila API tidak bisa diakses)
  useEffect(() => {
    api.get('/products')
      .then((res) => {
        const list = (res.data.data || []).map((p) => ({
          id: Number(p.product_id),
          name: p.name,
          price: Number(p.price),
          unit: p.unit,
          category: p.category,
          image: p.image_url,
          stock: Number(p.stock),
        }));
        if (list.length) {
          setProducts(list);
          setCategories(['Semua', ...Array.from(new Set(list.map((x) => x.category).filter(Boolean)))]);
        }
      })
      .catch(() => {});
  }, []);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: +(item.quantity + qty).toFixed(3) } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, unit: product.unit, image: product.image, quantity: qty }];
    });
    showToast(`${product.name} ${fmtQty(qty, product.unit)} ditambahkan`);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    localStorage.removeItem('token');
    setUser(null);
    showToast('Berhasil keluar');
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const min = item.unit === 'kg' ? 0.1 : 1;
        return { ...item, quantity: +Math.max(min, quantity).toFixed(3) };
      })
    );
  };

  const clearCart = () => setCart([]);
  const subtotal = cart.reduce((sum, i) => sum + lineTotal(i.price, i.quantity), 0);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        subtotal,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        products,
        categories,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] toast-in rounded-xl bg-emerald-900 text-white text-sm px-4 py-3 shadow-lg">{toast}</div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
