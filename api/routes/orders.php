<?php
class OrdersRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        require_once __DIR__ . '/../middleware/auth.php';
        $path = isset($uri[1]) ? $uri[1] : '';
        
        if ($method === 'POST' && $path === 'callback') {
            $this->paymentCallback();
            return;
        }
        
        $auth = new AuthMiddleware($this->conn);
        $user = $auth->authenticate();

        if ($method === 'POST' && empty($path)) {
            $this->createOrder($user);
        } elseif ($method === 'GET' && empty($path)) {
            $this->listOrders($user);
        } elseif ($method === 'GET' && is_numeric($path)) {
            $this->getOrder($path, $user);
        } elseif ($method === 'PUT' && is_numeric($path) && isset($uri[2]) && $uri[2] === 'status') {
            $auth->authorizeAdmin();
            $this->updateStatus($path);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Not found"]);
        }
    }
    
    private function createOrder($user) {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->items) || !isset($data->address)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete data"]);
            return;
        }

        // Subtotal dihitung ulang dari harga di database (jangan percaya harga dari browser)
        $subtotal = 0;
        $pstmt = $this->conn->prepare("SELECT price, stock FROM products WHERE product_id = ? AND is_active = 1");
        foreach ($data->items as $it) {
            $qty = max(0.1, round((float)($it->quantity ?? 1), 3));
            $pstmt->execute([(int)($it->id ?? 0)]);
            $p = $pstmt->fetch();
            if (!$p || $qty > (float)$p['stock']) {
                http_response_code(422);
                echo json_encode(["status" => "error", "message" => "Produk tidak tersedia atau stok kurang"]);
                return;
            }
            $subtotal += round($p['price'] * $qty);
        }
        // Lokasi pengantaran wajib dipilih di peta. Jarak & ongkir dihitung ulang di server
        // dari koordinat (jarak/ongkir kiriman browser diabaikan).
        require_once __DIR__ . '/../config/shipping_helper.php';
        $cfg = shipping_load($this->conn);
        $lat = (isset($data->lat) && is_numeric($data->lat)) ? (float)$data->lat : null;
        $lng = (isset($data->lng) && is_numeric($data->lng)) ? (float)$data->lng : null;
        if ($lat === null || $lng === null || abs($lat) > 90 || abs($lng) > 180) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Tandai lokasi pengantaran di peta terlebih dahulu"]);
            return;
        }
        $dist = shipping_distance_km($cfg['store_lat'], $cfg['store_lng'], $lat, $lng);
        if ($cfg['max_radius_km'] > 0 && $dist > $cfg['max_radius_km']) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Alamat di luar jangkauan pengiriman (maksimal " . rtrim(rtrim(number_format($cfg['max_radius_km'], 2, '.', ''), '0'), '.') . " km dari toko)"]);
            return;
        }
        $delivery_fee = shipping_fee($cfg, $dist, $subtotal);
        $discount = 0;
        $voucher_code = null;
        if (!empty($data->voucher_code)) {
            $vs = $this->conn->prepare("SELECT * FROM vouchers WHERE code = ? AND is_active = 1");
            $vs->execute([strtoupper(trim($data->voucher_code))]);
            $v = $vs->fetch();
            $bad = !$v || ($v['expires_at'] && strtotime($v['expires_at']) < time())
                || ($v['quota'] > 0 && $v['used_count'] >= $v['quota']) || $subtotal < $v['min_spend'];
            if (!$bad && !empty($v['once_per_user'])) {
                $used = $this->conn->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ? AND voucher_code = ? AND status <> 'cancelled'");
                $used->execute([$user['user_id'], $v['code']]);
                $bad = $used->fetchColumn() > 0;
            }
            if ($bad) {
                http_response_code(422);
                echo json_encode(["status" => "error", "message" => "Voucher tidak berlaku"]);
                return;
            }
            $discount = $v['type'] === 'fixed' ? $v['value'] : $subtotal * $v['value'] / 100;
            if ($v['type'] !== 'fixed' && $v['max_discount'] > 0) $discount = min($discount, $v['max_discount']);
            $discount = round(min($discount, $subtotal));
            $voucher_code = $v['code'];
        }
        $total = $subtotal + $delivery_fee - $discount;
        
        $order_id = "WS-" . time() . "-" . $user['user_id'];

        $query = "INSERT INTO orders (user_id, customer_name, customer_phone, items, subtotal, delivery_fee, discount, total, voucher_code, address, lat, lng, distance_km, midtrans_order_id, notes) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                  
        $stmt = $this->conn->prepare($query);
        if ($stmt->execute([
            $user['user_id'],
            substr(trim($data->name ?? $user['name']), 0, 255),
            substr(trim($data->phone ?? ''), 0, 30),
            json_encode($data->items),
            $subtotal,
            $delivery_fee,
            $discount,
            $total,
            $voucher_code,
            $data->address,
            $lat,
            $lng,
            $dist,
            $order_id,
            $data->notes ?? null
        ])) {
            $db_order_id = $this->conn->lastInsertId();
            
            $token = $this->generateSnapToken($order_id, $total, $user);
            
            if ($token) {
                $this->conn->prepare("UPDATE orders SET payment_token = ? WHERE order_id = ?")->execute([$token, $db_order_id]);
            }
            
            echo json_encode([
                "status" => "success", 
                "message" => "Order created",
                "order_id" => $db_order_id,
                "payment_token" => $token
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to create order"]);
        }
    }
    
    private function generateSnapToken($order_id, $gross_amount, $user) {
        $server_key = MIDTRANS_SERVER_KEY;
        $url = MIDTRANS_IS_PRODUCTION ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
        
        $payload = [
            'transaction_details' => [
                'order_id' => $order_id,
                'gross_amount' => round($gross_amount),
            ],
            'customer_details' => [
                'first_name' => $user['name'],
                'email' => $user['email'],
            ]
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Basic ' . base64_encode($server_key . ':')
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response);
        return $result->token ?? null;
    }
    
    private function listOrders($user) {
        $query = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
        if ($user['role'] === 'admin') {
            $query = "SELECT * FROM orders ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
        } else {
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$user['user_id']]);
        }
        
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    }
    
    private function getOrder($id, $user) {
        $query = "SELECT * FROM orders WHERE order_id = ?";
        if ($user['role'] !== 'admin') {
            $query .= " AND user_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id, $user['user_id']]);
        } else {
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
        }
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "data" => $stmt->fetch()]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Order not found"]);
        }
    }
    
    // Satu pintu untuk semua perubahan status: mengatur stok, pemakaian voucher, dan hitungan pelanggan setia.
    private function applyStatus($col, $val, $new, $onlyFrom = null) {
        $stmt = $this->conn->prepare("SELECT * FROM orders WHERE $col = ?");
        $stmt->execute([$val]);
        $o = $stmt->fetch();
        if (!$o) return 'notfound';
        $old = $o['status'];
        if ($old === $new) return 'ok';
        if ($onlyFrom !== null && $old !== $onlyFrom) return 'skipped';
        if (in_array($old, ['completed', 'cancelled'])) return 'locked';

        $this->conn->beginTransaction();
        try {
            $items = json_decode($o['items'], true) ?: [];
            $holds = ['paid', 'processing', 'shipping'];
            if ($old === 'pending' && in_array($new, array_merge($holds, ['completed']))) {
                $q = $this->conn->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE product_id = ?");
                foreach ($items as $it) $q->execute([(float)($it['quantity'] ?? 0), (int)($it['id'] ?? 0)]);
                if (!empty($o['voucher_code'])) {
                    $this->conn->prepare("UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?")->execute([$o['voucher_code']]);
                }
            }
            if (in_array($old, $holds) && $new === 'cancelled') {
                $q = $this->conn->prepare("UPDATE products SET stock = stock + ? WHERE product_id = ?");
                foreach ($items as $it) $q->execute([(float)($it['quantity'] ?? 0), (int)($it['id'] ?? 0)]);
            }
            if ($new === 'completed') {
                $this->conn->prepare("UPDATE users SET completed_order_count = completed_order_count + 1 WHERE user_id = ?")->execute([$o['user_id']]);
            }
            $this->conn->prepare("UPDATE orders SET status = ? WHERE order_id = ?")->execute([$new, $o['order_id']]);
            $this->conn->commit();
            return 'ok';
        } catch (Exception $e) {
            $this->conn->rollBack();
            return 'error';
        }
    }

    private function updateStatus($id) {
        $data = json_decode(file_get_contents("php://input"));
        $allowed = ['pending', 'paid', 'processing', 'shipping', 'completed', 'cancelled'];
        if (!isset($data->status) || !in_array($data->status, $allowed)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Status tidak valid"]);
            return;
        }
        $r = $this->applyStatus('order_id', $id, $data->status);
        if ($r !== 'ok') {
            http_response_code($r === 'notfound' ? 404 : 409);
            echo json_encode(["status" => "error", "message" => $r === 'locked' ? "Pesanan sudah selesai/dibatalkan" : "Gagal mengubah status"]);
            return;
        }
        echo json_encode(["status" => "success", "message" => "Status diperbarui"]);
    }

    private function paymentCallback() {
        $payload = json_decode(file_get_contents('php://input'));
        if (!$payload || !isset($payload->order_id, $payload->status_code, $payload->gross_amount, $payload->signature_key)) {
            http_response_code(400);
            return;
        }
        $signature_key = hash("sha512", $payload->order_id . $payload->status_code . $payload->gross_amount . MIDTRANS_SERVER_KEY);
        if (!hash_equals($signature_key, $payload->signature_key)) {
            http_response_code(401);
            echo "Invalid signature";
            return;
        }
        $ts = $payload->transaction_status ?? '';
        if ($ts === 'capture' || $ts === 'settlement') {
            $this->applyStatus('midtrans_order_id', $payload->order_id, 'paid', 'pending');
        } elseif (in_array($ts, ['cancel', 'deny', 'expire'])) {
            $this->applyStatus('midtrans_order_id', $payload->order_id, 'cancelled', 'pending');
        }
        echo json_encode(["status" => "success"]);
    }
}
