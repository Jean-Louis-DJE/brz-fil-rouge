<?php
header("Content-Type: application/json");
include "config.php";

$userId = $_GET['id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "ID manquant"]);
    exit;
}

try {
    // Supprimer l'utilisateur basé sur l'ID
    $stmt = $pdo->prepare("DELETE FROM utilisateur WHERE id = ?");
    $stmt->execute([$userId]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>