<?php
class VouchersRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        require_once __DIR__ . '/../middleware/auth.php';
        $path = isset($uri[1]) ? $uri[1] : '';
        
        $auth = new AuthMiddleware($this->conn);
        $user = $auth->authenticate();

        if ($method === 'POST' && $path === 'validate') {
            $this->validateVoucher($user);
        } else {
            $auth->authorizeAdmin();
            if ($method === 'GET' && empty($path)) {
                $this->listVouchers();
            } elseif ($method === 'POST' && empty($path)) {
                $this->createVoucher();
            } elseif ($method === 'PUT' && is_numeric($path)) {
                $d = json_decode(file_get_contents("php://input"));
                $this->conn->prepare("UPDATE vouchers SET is_active = ? WHERE voucher_id = ?")->execute([!empty($d->is_active) ? 1 : 0, $path]);
                echo json_encode(["status" => "success"]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
            }
        }
    }
    
    private function validateVoucher($user) {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->code) || !isset($data->subtotal)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete data"]);
            return;
        }
        
        $stmt = $this->conn->prepare("SELECT * FROM vouchers WHERE code = ? AND is_active = 1");
        $stmt->execute([$data->code]);
        
        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Voucher not found or inactive"]);
            return;
        }
        
        $voucher = $stmt->fetch();
        
        if ($voucher['expires_at'] && strtotime($voucher['expires_at']) < time()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Voucher expired"]);
            return;
        }
        
        if ($voucher['quota'] > 0 && $voucher['used_count'] >= $voucher['quota']) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Voucher quota exceeded"]);
            return;
        }
        
        if ($data->subtotal < $voucher['min_spend']) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Minimum spend not met. Requires: Rp " . $voucher['min_spend']]);
            return;
        }
        
        $discount = 0;
        if ($voucher['type'] == 'fixed') {
            $discount = $voucher['value'];
        } else {
            $discount = ($data->subtotal * $voucher['value']) / 100;
            if ($voucher['max_discount'] > 0 && $discount > $voucher['max_discount']) {
                $discount = $voucher['max_discount'];
            }
        }
        
        echo json_encode([
            "status" => "success", 
            "data" => [
                "discount" => $discount,
                "code" => $voucher['code']
            ]
        ]);
    }
    
    private function listVouchers() {
        $stmt = $this->conn->query("SELECT * FROM vouchers ORDER BY created_at DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    }
    
    private function createVoucher() {
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO vouchers (code, type, value, max_discount, min_spend, quota, expires_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            $data->code,
            $data->type,
            $data->value,
            $data->max_discount ?? null,
            $data->min_spend ?? 0,
            $data->quota ?? 0,
            $data->expires_at ?? null
        ]);
        
        echo json_encode(["status" => "success", "message" => "Voucher created"]);
    }
}
