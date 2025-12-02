<?php
// c:/xampp/htdocs/brz/backend/get_sensor_config.php
require 'config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT adresse_mac, nom, couleur FROM capteurs");
    $config = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($config);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
}
?>
