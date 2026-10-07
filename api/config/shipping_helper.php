<?php
// Pengaturan & perhitungan ongkir. Dipakai oleh orders.php dan shipping.php.
// Nilai disimpan di tabel `settings` (setting_key = 'shipping'); bila belum ada, memakai nilai bawaan di bawah.
// Jarak = jarak lurus (radius) dari toko ke titik pengantaran, dihitung dengan rumus haversine.

function shipping_defaults() {
    return [
        'store_lat'     => -6.208326360287679,
        'store_lng'     => 106.79637092720068,
        'max_radius_km' => 0,       // 0 = tanpa batas jangkauan
        'base_km'       => defined('SHIPPING_BASE_KM') ? SHIPPING_BASE_KM : 2,
        'base_fee'      => defined('SHIPPING_BASE_FEE') ? SHIPPING_BASE_FEE : 8000,
        'per_km_fee'    => defined('SHIPPING_PER_KM_FEE') ? SHIPPING_PER_KM_FEE : 2500,
        'free_enabled'  => true,
        'free_tiers'    => [
            ['min_spend' => 200000,  'max_km' => 1],
            ['min_spend' => 300000,  'max_km' => 2],
            ['min_spend' => 400000,  'max_km' => 4],
            ['min_spend' => 1000000, 'max_km' => 7],
        ],
    ];
}

// Memvalidasi & merapikan input. Mengembalikan [config, daftar_error].
// Kunci yang tidak dikirim memakai nilai dari $base.
function shipping_normalize($in, $base) {
    $cfg = $base;
    $err = [];
    if (!is_array($in)) return [$cfg, ['Data tidak valid']];

    $num = function ($key, $label, $min, $max) use ($in, &$cfg, &$err) {
        if (!array_key_exists($key, $in)) return;
        $v = $in[$key];
        if (!is_numeric($v)) { $err[] = "$label harus berupa angka"; return; }
        $v = (float)$v;
        if ($v < $min || $v > $max) { $err[] = "$label harus antara $min dan $max"; return; }
        $cfg[$key] = $v;
    };
    $num('store_lat', 'Latitude toko', -90, 90);
    $num('store_lng', 'Longitude toko', -180, 180);
    $num('max_radius_km', 'Jangkauan maksimal (km)', 0, 500);
    $num('base_km', 'Jarak tarif dasar (km)', 0, 100);
    $num('base_fee', 'Tarif dasar (Rp)', 0, 10000000);
    $num('per_km_fee', 'Tarif per km tambahan (Rp)', 0, 10000000);

    if (array_key_exists('free_enabled', $in)) $cfg['free_enabled'] = filter_var($in['free_enabled'], FILTER_VALIDATE_BOOLEAN);

    if (array_key_exists('free_tiers', $in)) {
        $tiers = [];
        if (!is_array($in['free_tiers']) || count($in['free_tiers']) > 20) {
            $err[] = 'Aturan gratis ongkir maksimal 20 baris';
        } else {
            foreach ($in['free_tiers'] as $i => $t) {
                $t = (array)$t;
                $n = is_int($i) ? $i + 1 : $i;
                if (!isset($t['min_spend'], $t['max_km']) || !is_numeric($t['min_spend']) || !is_numeric($t['max_km'])) {
                    $err[] = "Aturan gratis ongkir #$n belum lengkap"; continue;
                }
                $ms = (float)$t['min_spend']; $mk = (float)$t['max_km'];
                if ($ms < 0 || $ms > 1000000000) { $err[] = "Minimal belanja pada aturan #$n tidak valid"; continue; }
                if ($mk <= 0 || $mk > 500) { $err[] = "Jarak maksimal pada aturan #$n harus lebih dari 0 dan maksimal 500 km"; continue; }
                $tiers[] = ['min_spend' => $ms, 'max_km' => $mk];
            }
            usort($tiers, function ($a, $b) { return $a['min_spend'] <=> $b['min_spend'] ?: $a['max_km'] <=> $b['max_km']; });
            $cfg['free_tiers'] = $tiers;
        }
    }
    return [$cfg, $err];
}

function shipping_load($conn) {
    $cfg = shipping_defaults();
    try {
        $st = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'shipping'");
        $st->execute();
        $raw = $st->fetchColumn();
        $saved = $raw ? json_decode($raw, true) : null;
        if (is_array($saved)) {
            list($merged, $err) = shipping_normalize($saved, $cfg);
            $cfg = $merged; // nilai yang tidak valid diabaikan, sisanya dipakai
        }
    } catch (Exception $e) {
        // tabel belum ada / error DB: pakai nilai bawaan
    }
    return $cfg;
}

function shipping_save($conn, $cfg) {
    $json = json_encode($cfg);
    $st = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('shipping', ?)
                          ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    return $st->execute([$json]);
}

// Jarak lurus (km) antara dua titik, dibulatkan 2 desimal.
function shipping_distance_km($lat1, $lng1, $lat2, $lng2) {
    $r = 6371.0088;
    $p1 = deg2rad($lat1); $p2 = deg2rad($lat2);
    $dp = $p2 - $p1; $dl = deg2rad($lng2 - $lng1);
    $a = sin($dp / 2) * sin($dp / 2) + cos($p1) * cos($p2) * sin($dl / 2) * sin($dl / 2);
    $d = 2 * $r * asin(min(1, sqrt($a)));
    return round($d, 2);
}

// true bila belanja & jarak memenuhi salah satu aturan gratis ongkir.
function shipping_is_free($cfg, $distance, $subtotal) {
    if (empty($cfg['free_enabled'])) return false;
    foreach ($cfg['free_tiers'] as $t) {
        if ($subtotal >= $t['min_spend'] && $distance <= $t['max_km']) return true;
    }
    return false;
}

function shipping_fee($cfg, $distance, $subtotal) {
    if (shipping_is_free($cfg, $distance, $subtotal)) return 0;
    if ($distance <= $cfg['base_km']) return (int)round($cfg['base_fee']);
    return (int)round($cfg['base_fee'] + ceil($distance - $cfg['base_km']) * $cfg['per_km_fee']);
}
