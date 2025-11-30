<?php
header("Content-Type: application/json");
include "config.php";

try {
    // Cette requête SQL est conçue pour récupérer une liste unique d'adresses MAC
    // provenant de deux sources différentes, sans doublons.
    // 1. `SELECT adresse_mac FROM capteurs`: Récupère toutes les adresses MAC déjà configurées dans la table `capteurs`.
    // 2. `UNION`: Combine les résultats des deux requêtes et supprime automatiquement les doublons.
    // 3. `SELECT DISTINCT adresse_mac_capteur FROM consommation`: Récupère toutes les adresses MAC uniques qui ont déjà envoyé au moins une mesure.
    
    $stmt = $pdo->query("
        SELECT adresse_mac FROM capteurs
        UNION
        SELECT DISTINCT adresse_mac_capteur AS adresse_mac FROM consommation
    ");

    // On utilise fetchAll avec PDO::FETCH_COLUMN pour obtenir un tableau simple ['mac1', 'mac2', ...]
    $mac_addresses = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($mac_addresses);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur lors de la récupération des adresses MAC connues: " . $e->getMessage()]);
}
?>