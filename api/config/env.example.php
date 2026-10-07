<?php
// Example Environment Configuration
// Rename this file to env.php and configure for your environment

define('DB_HOST', 'localhost');
define('DB_NAME', 'wiwiksayur_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('GOOGLE_MAPS_API_KEY', 'YOUR_GOOGLE_MAPS_API_KEY');
define('MIDTRANS_SERVER_KEY', 'YOUR_MIDTRANS_SERVER_KEY');
define('MIDTRANS_CLIENT_KEY', 'YOUR_MIDTRANS_CLIENT_KEY');
define('MIDTRANS_IS_PRODUCTION', false);

// Google Login: Client ID dari Google Cloud Console > Credentials > OAuth client ID (Web)
define('GOOGLE_CLIENT_ID', 'xxxx.apps.googleusercontent.com');

define('APP_URL', 'https://wiwiksayur.com');
define('JWT_SECRET', 'YOUR_JWT_SECRET_KEY');

// Salin file ini menjadi env.php lalu isi nilai aslinya. JANGAN upload env.php ke GitHub.
