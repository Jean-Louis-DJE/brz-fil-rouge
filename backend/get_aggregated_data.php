<?php
// backend/get_aggregated_data.php
header("Content-Type: application/json");
include "config.php";

$date_debut = $_GET['start'] ?? date('Y-m-d', strtotime('-30 days')) . ' 00:00:00';
$date_fin = $_GET['end'] ?? date('Y-m-d') . ' 23:59:59';
$mac = $_GET['mac'] ?? 'ALL';
$grouping_type = $_GET['group_by_period'] ?? 'day'; // 'day', 'hour', ou 'month'

$mac_filter = '';
$params = [$date_debut, $date_fin];

if ($mac !== 'ALL') {
    $mac_filter = " AND adresse_mac_capteur = ?";
    $params[] = $mac;
}

// 1. Logique d'agrégation dynamique
if ($grouping_type === 'month') {
    // Regroupement par AN et MOIS (pour les vues Année)
    $group_by_select = "DATE_FORMAT(date_mesure, '%Y-%m-01') AS periode";
} elseif ($grouping_type === 'hour') {
    // Regroupement par JOUR et HEURE (pour la vue Jour)
    $group_by_select = "DATE_FORMAT(date_mesure, '%Y-%m-%d %H:00:00') AS periode";
} else {
    // Regroupement par JOUR (Par défaut, Semaine et Mois)
    $group_by_select = "DATE(date_mesure) AS periode";
}


$sql = "
    SELECT 
        " . $group_by_select . ",
        SUM(valeur) AS volume_total_litres
    FROM 
        consommation
    WHERE 
        date_mesure BETWEEN ? AND ?
        " . $mac_filter . "
    GROUP BY 
        periode
    ORDER BY
        periode ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$resultat = [];
foreach ($data as $row) {
    $resultat[] = [
        'date_mesure' => $row['periode'], 
        'valeur' => $row['volume_total_litres']
    ];
}

echo json_encode($resultat);
?>