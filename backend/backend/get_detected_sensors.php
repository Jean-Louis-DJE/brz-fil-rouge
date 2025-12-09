<?php
// backend/backend/get_detected_sensors.php
// Ce fichier récupère les capteurs détectés dans la base de données
require 'config.php'; // Votre fichier de connexion à la BDD
header('Content-Type: application/json');

try {
    // On récupère les adresses MAC des capteurs détectés
    // On utilise DISTINCT pour éviter les doublons
    $stmt = $pdo->query("SELECT DISTINCT sender_id FROM sensor_data ORDER BY sender_id");
    $macs = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    echo json_encode($macs);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
}
?>
