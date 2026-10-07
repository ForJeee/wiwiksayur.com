<?php
// Rumahweb (LiteSpeed/CGI) sering tidak menyediakan apache_request_headers(); pakai $_SERVER sebagai gantinya.
if (!function_exists('get_bearer_token')) {
    function get_bearer_token() {
        $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$h && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) { if (strtolower($k) === 'authorization') { $h = $v; break; } }
        }
        return preg_match('/Bearer\s(\S+)/', $h, $mm) ? $mm[1] : null;
    }
}

class AuthMiddleware {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function authenticate() {
        $token = get_bearer_token();
        if ($token) {
            return $this->validateToken($token);
        }

        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        exit;
    }
    
    public function authorizeAdmin() {
        $user = $this->authenticate();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Forbidden: Admin access required"]);
            exit;
        }
        return $user;
    }

    private function validateToken($token) {
        $query = "SELECT u.user_id, u.email, u.name, u.phone, u.picture, u.completed_order_count, u.role 
                  FROM user_sessions s
                  JOIN users u ON s.user_id = u.user_id
                  WHERE s.session_token = :token AND s.expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch();
        }
        
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid or expired token"]);
        exit;
    }
}
