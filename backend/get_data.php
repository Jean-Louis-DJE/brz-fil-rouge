<?php
header("Content-Type: application/json");
include "config.php";

$stmt = $pdo->query("SELECT * FROM consommation ORDER BY date_mesure DESC LIMIT 15");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Les renvoyer dans l’ordre chronologique (du plus ancien au plus récent)
$data = array_reverse($data);

echo json_encode($data);
?>
