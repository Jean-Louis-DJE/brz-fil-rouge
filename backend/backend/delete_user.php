<?php
// backend/backend/delete_user.php
// Ce fichier gère la suppression d'un utilisateur dans la base de données
header("Content-Type: application/json");
include "config.php";

$userId = $_GET['id'] ?? null;

// Valider que l'ID de l'utilisateur est bien présent
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