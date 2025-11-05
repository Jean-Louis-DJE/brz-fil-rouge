<?php
header("Content-Type: application/json");
include "config.php";

// Récupération du JSON envoyé
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['valeur'])) {
  http_response_code(400);
  echo json_encode(["error" => "valeur manquante"]);
  exit;
}

$valeur = floatval($data['valeur']);

$stmt = $pdo->prepare("INSERT INTO consommation (date_mesure, valeur) VALUES (NOW(), ?)");
$stmt->execute([$valeur]);

echo json_encode(["success" => true, "valeur" => $valeur]);
?>
