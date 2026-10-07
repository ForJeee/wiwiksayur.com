<?php
class AdminRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        require_once __DIR__ . '/../middleware/auth.php';
        $auth = new AuthMiddleware($this->conn);
        $auth->authorizeAdmin();

        $path = $uri[1] ?? '';
        if ($method === 'GET' && $path === 'dashboard') return $this->dashboard();
        if ($method === 'GET' && $path === 'orders') return $this->orders();
        if ($method === 'GET' && $path === 'products') return $this->products();
        if ($method === 'GET' && $path === 'messages') return $this->messages();
        if ($method === 'PUT' && $path === 'messages' && isset($uri[2]) && is_numeric($uri[2])) return $this->readMessage($uri[2]);

        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Not found"]);
    }

    private function one($sql) { return $this->conn->query($sql)->fetchColumn(); }

    private function dashboard() {
        $paid = "status IN ('paid','processing','shipping','completed')";
        $by = [];
        foreach ($this->conn->query("SELECT status, COUNT(*) c FROM orders GROUP BY status") as $r) $by[$r['status']] = (int)$r['c'];
        $series = $this->conn->query("SELECT DATE(created_at) d, COUNT(*) c, COALESCE(SUM(total),0) r FROM orders
            WHERE $paid AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at)")->fetchAll();
        echo json_encode(["status" => "success", "data" => [
            "by_status" => $by,
            "revenue_today" => (float)$this->one("SELECT COALESCE(SUM(total),0) FROM orders WHERE $paid AND DATE(created_at) = CURDATE()"),
            "orders_today" => (int)$this->one("SELECT COUNT(*) FROM orders WHERE $paid AND DATE(created_at) = CURDATE()"),
            "revenue_month" => (float)$this->one("SELECT COALESCE(SUM(total),0) FROM orders WHERE $paid AND created_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')"),
            "total_customers" => (int)$this->one("SELECT COUNT(*) FROM users WHERE role = 'user'"),
            "unread_messages" => (int)$this->one("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0"),
            "series" => $series,
            "low_stock" => $this->conn->query("SELECT product_id, name, stock, unit FROM products WHERE is_active = 1 AND stock <= 10 ORDER BY stock ASC LIMIT 10")->fetchAll(),
        ]]);
    }

    private function orders() {
        $rows = $this->conn->query("SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.completed_order_count
            FROM orders o JOIN users u ON u.user_id = o.user_id ORDER BY o.order_id DESC LIMIT 300")->fetchAll();
        foreach ($rows as &$r) { $r['items'] = json_decode($r['items'], true) ?: []; }
        echo json_encode(["status" => "success", "data" => $rows]);
    }

    private function products() {
        echo json_encode(["status" => "success", "data" => $this->conn->query("SELECT * FROM products ORDER BY is_active DESC, category, name")->fetchAll()]);
    }

    private function messages() {
        echo json_encode(["status" => "success", "data" => $this->conn->query("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 100")->fetchAll()]);
    }

    private function readMessage($id) {
        $this->conn->prepare("UPDATE contact_messages SET is_read = 1 WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success"]);
    }
}
