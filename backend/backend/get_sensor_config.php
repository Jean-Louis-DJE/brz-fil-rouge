<?php
// backend/backend/get_sensor_config.php
// Ce fichier récupère la configuration des capteurs depuis la base de données
require 'config.php';
header('Content-Type: application/json');

try {
    // On récupère les informations de configuration des capteurs
    $stmt = $pdo->query("SELECT adresse_mac, nom, couleur FROM capteurs");
    $config = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($config);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
}
?>
