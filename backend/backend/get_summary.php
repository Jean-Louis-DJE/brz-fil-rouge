<?php
// backend/backend/get_summary.php
// Ce fichier récupère un résumé des données de consommation d'eau
header("Content-Type: application/json");
include "config.php";

// Récupérer les dates du filtre (si elles existent)
$date_debut = $_GET['start'] ?? '1970-01-01 00:00:00';
$date_fin = $_GET['end'] ?? '2038-01-01 23:59:59';

// 1. Calculer le volume total REEL (ce qui est en BDD)
global $pdo;

$stmt = $pdo->prepare("
    SELECT SUM(value) AS volume_total_litres
    FROM sensor_data
    WHERE date_mesure BETWEEN ? AND ?
");
$stmt->execute([$date_debut, $date_fin]);
$summary = $stmt->fetch(PDO::FETCH_ASSOC);

$volume_litres_reel = $summary['volume_total_litres'] ?? 0;

// 2. Calculer le coût (basé sur le total réel)
$prix_m3 = 2.25; 
$volume_m3 = $volume_litres_reel / 1000.0;
$cout_total = $volume_m3 * $prix_m3;

// 3. Renvoyer toutes les infos au format JSON
echo json_encode([
    'volume_total_litres' => $volume_litres_reel,
    'cout_total_euros' => round($cout_total, 2) 
]);
?>