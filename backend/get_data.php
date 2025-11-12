<?php
header("Content-Type: application/json");
include "config.php";

// Si les dates sont fournies, on filtre avec
if (isset($_GET['start']) && isset($_GET['end'])) {
    
    $stmt = $pdo->prepare("
        SELECT * FROM consommation
        WHERE date_mesure BETWEEN ? AND ?
        ORDER BY date_mesure ASC
    ");
    $stmt->execute([$_GET['start'], $_GET['end']]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Les données sont déjà dans le bon ordre (ASC)
    echo json_encode($data);

} else {
    // Comportement par défaut (les 15 dernières)
    $stmt = $pdo->query("SELECT * FROM consommation ORDER BY date_mesure DESC LIMIT 15");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Les renvoyer dans l’ordre chronologique (du plus ancien au plus récent)
    $data = array_reverse($data);
    echo json_encode($data);
}
?>