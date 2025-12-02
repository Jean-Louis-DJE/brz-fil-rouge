<?php
// backend/get_breakdown.php
header("Content-Type: application/json");
include "config.php";

// Définir la période par défaut (ex: le mois entier)
$date_debut = $_GET['start'] ?? date('Y-m-d', strtotime('-30 days')) . ' 00:00:00';
$date_fin = $_GET['end'] ?? date('Y-m-d') . ' 23:59:59';
$prix_m3 = 2.25; 

// NOUVEAU : On récupère aussi le filtre MAC, bien qu'il soit moins pertinent ici,
// car l'idée est de montrer le total, mais on le gère pour la cohérence.
$mac = $_GET['mac'] ?? 'ALL'; 

$mac_filter = '';
$params = [$date_debut, $date_fin];

if ($mac !== 'ALL') {
    $mac_filter = " AND sender_id = ?";
    $params[] = $mac;
}

// 1. Requête SQL: Total agrégé par capteur
$sql = "
    SELECT 
        sender_id,
        SUM(value) AS volume_total_litres
    FROM 
        sensor_data
    WHERE 
        date_mesure BETWEEN ? AND ?
        " . $mac_filter . "
    GROUP BY 
        sender_id
";

global $pdo;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$total_global_litres = array_sum(array_column($data, 'volume_total_litres'));
$resultat = [];

// 2. Calcul des coûts et des pourcentages
foreach ($data as $row) {
    $volume_litres = $row['volume_total_litres'];
    $volume_m3 = $volume_litres / 1000.0;
    $cout_total = $volume_m3 * $prix_m3;
    $pourcentage = ($total_global_litres > 0) ? ($volume_litres / $total_global_litres) * 100 : 0;

    $resultat[] = [
        'mac' => $row['sender_id'],
        'volume_litres' => $volume_litres,
        'cout_euros' => round($cout_total, 2),
        'pourcentage' => round($pourcentage, 2)
    ];
}

echo json_encode($resultat);
?>