CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  role ENUM('admin', 'user') DEFAULT 'user',
  picture TEXT,
  completed_order_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  stock INT DEFAULT 0,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(30),
  items JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  voucher_code VARCHAR(50),
  address TEXT NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  distance_km DECIMAL(10,2),
  status ENUM('pending', 'paid', 'processing', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
  payment_token VARCHAR(255),
  payment_url TEXT,
  midtrans_order_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE vouchers (
  voucher_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percentage', 'fixed') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_spend DECIMAL(10,2) DEFAULT 0,
  quota INT DEFAULT 0,
  used_count INT DEFAULT 0,
  once_per_user BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE geocache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  address_key VARCHAR(255) NOT NULL UNIQUE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  display_name TEXT,
  precision_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- DATA AWAL (SEED DATA)
-- ========================================================

-- Akun Administrator Default (password: admin123)
-- hash bcrypt untuk 'admin123'
INSERT INTO users (user_id, email, name, phone, password_hash, role) VALUES 
(1, 'admin@wiwiksayur.com', 'Admin WiwikSayur', '081234567890', '$2y$10$w0.04LZZq9v04aZp5rE2vOpwZ6K3j2VpUj0bJpQ1s9N7m4qL2bA1e', 'admin'),
(2, 'pelanggan@wiwiksayur.com', 'Budi Santoso', '085814420843', '$2y$10$w0.04LZZq9v04aZp5rE2vOpwZ6K3j2VpUj0bJpQ1s9N7m4qL2bA1e', 'user');

-- Produk Sayuran & Buah Segar
INSERT INTO products (name, category, price, unit, stock, image_url, description, is_active) VALUES
('Bayam Hijau Organik', 'Sayuran', 5000.00, 'ikat', 50, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80', 'Bayam segar organik hasil panen pagi hari, tanpa pestisida kimia. Kaya zat besi dan serat.', TRUE),
('Kangkung Segar', 'Sayuran', 4000.00, 'ikat', 60, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80', 'Kangkung air segar, renyah dan cocok untuk tumis terasi atau cah kangkung.', TRUE),
('Wortel Berastagi Super', 'Sayuran', 12000.00, 'kg', 40, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80', 'Wortel manis segar dari Berastagi, renyah, kaya vitamin A, cocok untuk sup dan jus.', TRUE),
('Brokoli Hijau Segar', 'Sayuran', 18000.00, 'kg', 25, 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=600&auto=format&fit=crop&q=80', 'Brokoli hijau padat tanpa ulat, kaya antioksidan dan vitamin C.', TRUE),
('Tomat Ceri Merah Segar', 'Sayuran', 15000.00, '500g', 30, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', 'Tomat ceri merah ranum, manis-asam segar, pas untuk salad dan garnish hidangan.', TRUE),
('Cabai Rawit Merah Juara', 'Bumbu Dapur', 35000.00, 'kg', 20, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', 'Cabai rawit merah pedas mantap pilihan, petik segar langsung dari petani.', TRUE),
('Bawang Merah Brebes Super', 'Bumbu Dapur', 28000.00, 'kg', 35, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', 'Bawang merah Brebes wangi dan renyah, kualitas super pilihan.', TRUE),
('Pisang Cavendish Fresh', 'Buah-buahan', 22000.00, 'sisir', 30, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', 'Pisang Cavendish kulit mulus, manis lembut, sumber energi alami harian keluarga.', TRUE),
('Apel Malang Manis Segar', 'Buah-buahan', 25000.00, 'kg', 25, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', 'Apel khas Malang dengan kerenyahan maksimal dan rasa manis asam menyegarkan.', TRUE),
('Jeruk Medan Manis Segar', 'Buah-buahan', 24000.00, 'kg', 40, 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80', 'Jeruk Medan manis banyak air, cocok untuk diperas jadi jus segar atau konsumsi langsung.', TRUE),
('Alpukat Mentega Super', 'Buah-buahan', 32000.00, 'kg', 20, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80', 'Alpukat mentega daging tebal legit, tidak berserat, cocok untuk jus atau guacamole.', TRUE),
('Semangka Merah Tanpa Biji', 'Buah-buahan', 18000.00, 'buah', 15, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80', 'Semangka merah manis berair tanpa biji, pelepas dahaga sempurna saat cuaca panas.', TRUE);

-- Voucher Diskon & Gratis Ongkir
INSERT INTO vouchers (code, type, value, max_discount, min_spend, quota, used_count, once_per_user, is_active, expires_at) VALUES
('SEGAR20', 'percentage', 20.00, 25000.00, 75000.00, 100, 0, TRUE, TRUE, '2027-12-31 23:59:59'),
('HEMAT10RB', 'fixed', 10000.00, 10000.00, 50000.00, 200, 0, TRUE, TRUE, '2027-12-31 23:59:59'),
('PELANGGANBARU', 'percentage', 15.00, 20000.00, 40000.00, 500, 0, TRUE, TRUE, '2027-12-31 23:59:59');

-- Pengaturan Toko
INSERT INTO settings (setting_key, setting_value) VALUES
('store_info', '{"name": "Wiwik Sayur Store", "tagline": "Menyediakan Sayuran & Buah Fresh", "address": "ISI_ALAMAT_TOKO", "lat": -6.208326360287679, "lng": 106.79637092720068, "phone": "085814420843", "email": "ISI_EMAIL_TOKO"}'),
('shipping', '{"store_lat": -6.208326360287679, "store_lng": 106.79637092720068, "max_radius_km": 0, "base_fee": 8000, "base_km": 2, "per_km_fee": 2500, "free_enabled": true, "free_tiers": [{"min_spend": 200000, "max_km": 1}, {"min_spend": 300000, "max_km": 2}, {"min_spend": 400000, "max_km": 4}, {"min_spend": 1000000, "max_km": 7}]}');
