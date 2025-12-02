<?php
header("Content-Type: application/json");
include "config.php";

try {
    // On récupère tous les utilisateurs
    $stmt = $pdo->query("SELECT id, prenom, nom, age, genre, is_sportif FROM utilisateur ORDER BY is_main_user DESC, id ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'users' => $users,
        'count' => count($users) // On renvoie aussi le nombre total
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de liste utilisateurs: " . $e->getMessage()]);
}
?>