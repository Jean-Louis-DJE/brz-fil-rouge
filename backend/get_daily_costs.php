<?php
header("Content-Type: application/json");
include "config.php";

// Récupération des dates (on utilise les dates du filtre de l'interface)
$date_debut = $_GET['start'] ?? date('Y-m-d', strtotime('-7 days')) . ' 00:00:00';
$date_fin = $_GET['end'] ?? date('Y-m-d') . ' 23:59:59';

// Pour l'instant, le prix est en dur.
$prix_m3 = 2.25; 

// Requête SQL pour agréger (SUM) la consommation par jour
$stmt = $pdo->prepare("
    SELECT 
        DATE(date_mesure) AS jour,
        SUM(valeur) AS volume_total_litres
    FROM 
        consommation
    WHERE 
        date_mesure BETWEEN ? AND ?
    GROUP BY 
        jour
    ORDER BY
        jour ASC
");
$stmt->execute([$date_debut, $date_fin]);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$resultat = [];

// Calcul du coût pour chaque jour
foreach ($data as $row) {
    // 1. Calcul du coût total (Litres -> m³ -> €)
    $volume_m3 = $row['volume_total_litres'] / 1000.0;
    $cout_total = $volume_m3 * $prix_m3;

    // 2. Formatage pour le frontend
    $resultat[] = [
        'jour' => $row['jour'], // Ex: '2025-11-05'
        'volume_litres' => round($row['volume_total_litres'], 0),
        'cout_euros' => round($cout_total, 2)
    ];
}

// 3. Renvoyer les données au format JSON
echo json_encode($resultat);
?>