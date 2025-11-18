<?php
// backend/get_daily_costs.php
header("Content-Type: application/json");
include "config.php";

// Récupération des filtres
$date_debut = $_GET['start'] ?? date('Y-m-d', strtotime('-7 days')) . ' 00:00:00';
$date_fin = $_GET['end'] ?? date('Y-m-d') . ' 23:59:59';
$mac = $_GET['mac'] ?? 'ALL';
$grouping_type = $_GET['group_by_period'] ?? 'day'; // hour, day, month
$prix_m3 = 2.25; 

$mac_filter = '';
$params = [$date_debut, $date_fin];

if ($mac !== 'ALL') {
    $mac_filter = " AND adresse_mac_capteur = ?";
    $params[] = $mac;
}

// 1. Logique d'agrégation dynamique
if ($grouping_type === 'month') {
    // Regroupement par AN et MOIS (Ex: 2024-05-01)
    $group_by_select = "DATE_FORMAT(date_mesure, '%Y-%m-01') AS periode_label";
} elseif ($grouping_type === 'hour') {
    // Regroupement par JOUR et HEURE (Ex: 2024-05-15 14:00)
    $group_by_select = "DATE_FORMAT(date_mesure, '%Y-%m-%d %H:00:00') AS periode_label";
} else {
    // Regroupement par JOUR (Par défaut, Semaine et Mois)
    $group_by_select = "DATE(date_mesure) AS periode_label";
}


// Requête SQL pour agréger le volume par période
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
        periode_label
    ORDER BY
        periode_label ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$resultat = [];

foreach ($data as $row) {
    $volume_m3 = $row['volume_total_litres'] / 1000.0;
    $cout_total = $volume_m3 * $prix_m3;

    $resultat[] = [
        // Utiliser 'periode_label' pour la clé 'jour' car c'est l'étiquette de temps
        'jour' => $row['periode_label'], 
        'volume_litres' => round($row['volume_total_litres'], 0),
        'cout_euros' => round($cout_total, 2)
    ];
}

echo json_encode($resultat);
?>