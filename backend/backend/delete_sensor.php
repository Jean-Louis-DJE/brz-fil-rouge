<?php
header("Content-Type: application/json");
include "config.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$mac = $data['mac'] ?? null;

if (!$mac) {
    http_response_code(400);
    echo json_encode(["error" => "Adresse MAC manquante"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Supprimer de la configuration (table capteurs)
    $stmt1 = $pdo->prepare("DELETE FROM capteurs WHERE adresse_mac = ?");
    $stmt1->execute([$mac]);

    // 2. Supprimer toutes les données associées (table sensor_data)
    $stmt2 = $pdo->prepare("DELETE FROM sensor_data WHERE sender_id = ?");
    $stmt2->execute([$mac]);

    $pdo->commit();

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Erreur lors de la suppression du capteur: " . $e->getMessage()]);
}
?>