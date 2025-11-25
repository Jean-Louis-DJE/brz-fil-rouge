<?php
header("Content-Type: application/json");
include "config.php";

// Récupérer les dates du filtre (si elles existent)
$date_debut = $_GET['start'] ?? '1970-01-01 00:00:00';
$date_fin = $_GET['end'] ?? '2038-01-01 23:59:59';

// 1. Calculer le volume total REEL (ce qui est en BDD)
$stmt = $pdo->prepare("
    SELECT SUM(valeur) AS volume_total_litres
    FROM consommation
    WHERE date_mesure BETWEEN ? AND ?
");
$stmt->execute([$date_debut, $date_fin]);
$summary = $stmt->fetch(PDO::FETCH_ASSOC);

$volume_litres_reel = $summary['volume_total_litres'] ?? 0;

// ----- MODIFICATION : AJOUT D'UNE VALEUR DE BASE POUR LA SIMULATION -----
$valeur_de_base = 300; // On ajoute 300L
$volume_litres_simule = $valeur_de_base + $volume_litres_reel;
// --------------------------------------------------------------------

// 2. Calculer le coût (basé sur le NOUVEAU total simulé)
$prix_m3 = 2.25; 
$volume_m3 = $volume_litres_simule / 1000.0; // On utilise le total simulé
$cout_total = $volume_m3 * $prix_m3;

// 3. Renvoyer toutes les infos au format JSON
echo json_encode([
    'volume_total_litres' => $volume_litres_simule, // On renvoie le total simulé
    'cout_total_euros' => round($cout_total, 2) 
]);
?>