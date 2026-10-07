<?php
require_once 'middleware/cors.php';
require_once 'config/constants.php';
require_once 'config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$route_path = isset($_GET['route']) ? $_GET['route'] : '';
$uri = explode('/', trim($route_path, '/'));
$method = $_SERVER['REQUEST_METHOD'];

$base_route = $uri[0];

switch ($base_route) {
    case 'auth':
        require_once 'routes/auth.php';
        $controller = new AuthRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'products':
        require_once 'routes/products.php';
        $controller = new ProductsRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'orders':
        require_once 'routes/orders.php';
        $controller = new OrdersRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'shipping':
        require_once 'routes/shipping.php';
        $controller = new ShippingRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'vouchers':
        require_once 'routes/vouchers.php';
        $controller = new VouchersRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'admin':
        require_once 'routes/admin.php';
        $controller = new AdminRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    case 'contact':
        require_once 'routes/contact.php';
        $controller = new ContactRoute($db);
        $controller->handleRequest($method, $uri);
        break;
    default:
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "API endpoint not found"]);
        break;
}
