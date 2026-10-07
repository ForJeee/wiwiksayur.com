<?php
require_once __DIR__ . '/../config/shipping_helper.php';

class ShippingRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        $path = isset($uri[1]) ? $uri[1] : '';

        if ($method === 'GET' && $path === 'config') {
            $this->getConfig();
        } elseif ($method === 'PUT' && $path === 'config') {
            $this->saveConfig();
        } elseif ($method === 'POST' && $path === 'quote') {
            $this->getQuote();
        } elseif ($method === 'GET' && $path === 'geocode') {
            $this->geocode();
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Not found"]);
        }
    }

    // Pengaturan ongkir & lokasi toko. Publik: dipakai halaman checkout untuk pratinjau ongkir.
    private function getConfig() {
        echo json_encode(["status" => "success", "data" => shipping_load($this->conn)]);
    }

    // Simpan pengaturan (khusus admin).
    private function saveConfig() {
        require_once __DIR__ . '/../middleware/auth.php';
        $auth = new AuthMiddleware($this->conn);
        $auth->authorizeAdmin();

        $in = json_decode(file_get_contents("php://input"), true);
        list($cfg, $errors) = shipping_normalize($in, shipping_load($this->conn));
        if ($errors) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => implode('. ', $errors)]);
            return;
        }
        if (!shipping_save($this->conn, $cfg)) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal menyimpan pengaturan"]);
            return;
        }
        echo json_encode(["status" => "success", "message" => "Pengaturan disimpan", "data" => $cfg]);
    }

    // Hitung jarak & ongkir untuk satu titik (hasil sama dengan yang dipakai saat pesanan dibuat).
    private function getQuote() {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->lat, $data->lng, $data->subtotal) || !is_numeric($data->lat) || !is_numeric($data->lng) || !is_numeric($data->subtotal)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete data"]);
            return;
        }
        $cfg = shipping_load($this->conn);
        $distance = shipping_distance_km($cfg['store_lat'], $cfg['store_lng'], (float)$data->lat, (float)$data->lng);
        $in_range = !($cfg['max_radius_km'] > 0 && $distance > $cfg['max_radius_km']);
        echo json_encode([
            "status" => "success",
            "data" => [
                "distance_km" => $distance,
                "in_range" => $in_range,
                "is_free" => shipping_is_free($cfg, $distance, (float)$data->subtotal),
                "delivery_fee" => shipping_fee($cfg, $distance, (float)$data->subtotal)
            ]
        ]);
    }

    private function geocode() {
        if (!isset($_GET['address'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Address is required"]);
            return;
        }

        $address = $_GET['address'];
        $url = "https://maps.googleapis.com/maps/api/geocode/json?address=" . urlencode($address) . "&key=" . GOOGLE_MAPS_API_KEY;

        $response = @file_get_contents($url);
        $data = json_decode($response);

        if ($data && $data->status === 'OK') {
            $loc = $data->results[0]->geometry->location;
            echo json_encode([
                "status" => "success",
                "data" => [
                    "lat" => $loc->lat,
                    "lng" => $loc->lng,
                    "formatted_address" => $data->results[0]->formatted_address
                ]
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Geocoding failed"]);
        }
    }
}
