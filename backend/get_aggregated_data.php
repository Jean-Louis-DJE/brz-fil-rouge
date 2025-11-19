<?php
// backend/get_aggregated_data.php
header("Content-Type: application/json");
include "config.php";

$date_debut = $_GET['start'] ?? date('Y-m-d', strtotime('-30 days')) . ' 00:00:00';
$date_fin = $_GET['end'] ?? date('Y-m-d') . ' 23:59:59';
$mac = $_GET['mac'] ?? 'ALL';
$grouping_type = $_GET['group_by_period'] ?? 'day'; 

$mac_filter = '';
$params = [$date_debut, $date_fin];

if ($mac !== 'ALL') {
    $mac_filter = " AND adresse_mac_capteur = ?";
    $params[] = $mac;
}

// Définition de la formule de formatage
if ($grouping_type === 'month') {
    $date_format_sql = "DATE_FORMAT(date_mesure, '%Y-%m-01')";
} elseif ($grouping_type === 'hour') {
    $date_format_sql = "DATE_FORMAT(date_mesure, '%Y-%m-%d %H:00:00')";
} else {
    $date_format_sql = "DATE(date_mesure)";
}

$sql = "
    SELECT 
        $date_format_sql as date_groupe,
        SUM(valeur) AS volume_total_litres
    FROM 
        consommation
    WHERE 
        date_mesure BETWEEN ? AND ?
        " . $mac_filter . "
    GROUP BY 
        $date_format_sql
    ORDER BY
        date_groupe ASC
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $resultat = [];
    foreach ($data as $row) {
        $resultat[] = [
            'date_mesure' => $row['date_groupe'], 
            'valeur' => $row['volume_total_litres']
        ];
    }

    echo json_encode($resultat);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>