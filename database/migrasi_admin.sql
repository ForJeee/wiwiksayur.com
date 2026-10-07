-- Jalankan SEKALI di phpMyAdmin bila database sudah terlanjur di-import dari schema.sql lama.
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) NULL AFTER user_id;
ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(30) NULL AFTER customer_name;
