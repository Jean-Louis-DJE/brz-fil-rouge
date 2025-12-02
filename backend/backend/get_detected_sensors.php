<?php
// c:/xampp/htdocs/brz/backend/get_detected_sensors.php
require 'config.php'; // Votre fichier de connexion à la BDD
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT DISTINCT sender_id FROM sensor_data ORDER BY sender_id");
    $macs = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    echo json_encode($macs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
}
?>
