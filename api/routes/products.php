<?php
class ProductsRoute {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleRequest($method, $uri) {
        $path = isset($uri[1]) ? $uri[1] : '';
        
        if ($method === 'GET' && empty($path)) {
            $this->listProducts();
        } elseif ($method === 'GET' && is_numeric($path)) {
            $this->getProduct($path);
        } else {
            // Admin only routes
            require_once __DIR__ . '/../middleware/auth.php';
            $auth = new AuthMiddleware($this->conn);
            $auth->authorizeAdmin();
            
            if ($method === 'POST' && empty($path)) {
                $this->createProduct();
            } elseif ($method === 'PUT' && is_numeric($path)) {
                $this->updateProduct($path);
            } elseif ($method === 'DELETE' && is_numeric($path)) {
                $this->deleteProduct($path);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
            }
        }
    }
    
    private function listProducts() {
        $query = "SELECT * FROM products WHERE is_active = 1";
        if (isset($_GET['search'])) {
            $query .= " AND name LIKE :search";
        }
        if (isset($_GET['category'])) {
            $query .= " AND category = :category";
        }
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if (isset($_GET['search'])) {
            $search = "%" . $_GET['search'] . "%";
            $stmt->bindParam(':search', $search);
        }
        if (isset($_GET['category'])) {
            $stmt->bindParam(':category', $_GET['category']);
        }
        
        $stmt->execute();
        $products = $stmt->fetchAll();
        
        echo json_encode(["status" => "success", "data" => $products]);
    }
    
    private function getProduct($id) {
        $stmt = $this->conn->prepare("SELECT * FROM products WHERE product_id = ? AND is_active = 1");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "data" => $stmt->fetch()]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Product not found"]);
        }
    }
    
    private function createProduct() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->name) || !isset($data->price)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Incomplete data"]);
            return;
        }
        
        $query = "INSERT INTO products (name, category, price, unit, stock, image_url, description) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([
            $data->name,
            $data->category ?? null,
            $data->price,
            $data->unit ?? null,
            $data->stock ?? 0,
            $data->image_url ?? null,
            $data->description ?? null
        ])) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Product created"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to create product"]);
        }
    }
    
    private function updateProduct($id) {
        $data = json_decode(file_get_contents("php://input"));
        $query = "UPDATE products SET 
                  name = COALESCE(?, name),
                  category = COALESCE(?, category),
                  price = COALESCE(?, price),
                  unit = COALESCE(?, unit),
                  stock = COALESCE(?, stock),
                  image_url = COALESCE(?, image_url),
                  description = COALESCE(?, description),
                  is_active = COALESCE(?, is_active)
                  WHERE product_id = ?";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            $data->name ?? null,
            $data->category ?? null,
            $data->price ?? null,
            $data->unit ?? null,
            $data->stock ?? null,
            $data->image_url ?? null,
            $data->description ?? null,
            $data->is_active ?? null,
            $id
        ]);
        
        echo json_encode(["status" => "success", "message" => "Product updated"]);
    }
    
    private function deleteProduct($id) {
        $stmt = $this->conn->prepare("UPDATE products SET is_active = 0 WHERE product_id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Product deleted"]);
    }
}
