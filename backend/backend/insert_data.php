<?php
// backend/insert_data.php
// Ce fichier insère des données de consommation d'eau dans la base de données
// Il attend une requête POST avec les données nécessaires

header('Content-Type: application/json');
include 'config.php';

// Récupérer les données POST
$data = json_decode(file_get_contents('php://input'), true);

$valeur = isset($data['valeur']) ? $data['valeur'] / 10 : null;
// Récupérer l'adresse MAC
$mac_address = $data['adresse_mac_capteur'] ?? null; 

if ($valeur === null || $mac_address === null) {
    http_response_code(400);
    echo json_encode(["message" => "Données manquantes (valeur ou adresse_mac_capteur)"]);
    exit();
}

try {
    // Ajout de l'adresse_mac_capteur dans la requête
    $stmt = $pdo->prepare("INSERT INTO consommation (date_mesure, valeur, adresse_mac_capteur) VALUES (NOW(), ?, ?)");
    $stmt->execute([$valeur, $mac_address]);

    echo json_encode(["message" => "Donnée insérée avec succès", "valeur" => $valeur, "capteur" => $mac_address]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de base de données : " . $e->getMessage()]);
}

?>