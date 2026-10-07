<?php
class ContactRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        if ($method === 'POST') {
            $this->submitForm();
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Not found"]);
        }
    }
    
    private function submitForm() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->name) || !isset($data->email) || !isset($data->message)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete data"]);
            return;
        }
        
        $query = "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([
            $data->name,
            $data->email,
            $data->phone ?? null,
            $data->message
        ])) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Message sent successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to send message"]);
        }
    }
}
