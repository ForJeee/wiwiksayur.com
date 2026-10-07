<?php
require_once __DIR__ . '/env.php';
// Semua konstanta (DB, Midtrans, Google) dibaca dari env.php.
// Nilai opsional diberi default agar tidak error bila belum diisi.
if (!defined('GOOGLE_CLIENT_ID')) define('GOOGLE_CLIENT_ID', '');
date_default_timezone_set('Asia/Jakarta');

define('SHIPPING_BASE_KM', 2);
define('SHIPPING_BASE_FEE', 8000);
define('SHIPPING_PER_KM_FEE', 2500);
