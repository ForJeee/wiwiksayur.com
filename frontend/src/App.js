import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

import Home from './pages/Home';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Track from './pages/Track';
import PaymentResult from './pages/PaymentResult';
import Policy from './pages/Policy';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return children;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CartDrawer />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tentang-kami" element={<AboutUs />} />
          <Route path="/kontak" element={<Contact />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/track/:orderId" element={<Track />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/kebijakan-privasi" element={<Policy slug="kebijakan-privasi" />} />
          <Route path="/refund-pembatalan" element={<Policy slug="refund-pembatalan" />} />
          <Route path="/syarat-ketentuan" element={<Policy slug="syarat-ketentuan" />} />
          <Route path="/pengiriman" element={<Policy slug="pengiriman" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
