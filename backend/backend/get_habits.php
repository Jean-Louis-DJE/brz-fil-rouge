<?php
header("Content-Type: application/json");
include "config.php";

try {
    // On récupère l'ID utilisateur (par défaut 1)
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;

    $stmt = $pdo->prepare("SELECT * FROM habitudes WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $habits = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($habits) {
        echo json_encode($habits);
    } else {
        // Si pas d'habitudes, on renvoie un objet vide ou null
        echo json_encode(null);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>