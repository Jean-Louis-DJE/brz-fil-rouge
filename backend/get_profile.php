<?php
header("Content-Type: application/json");
include "config.php";

try {
    // On récupère toujours l'utilisateur ID = 1
    $stmt = $pdo->query("SELECT * FROM utilisateur WHERE id = 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Si l'avatar est stocké côté backend, on prépare l'URL complète
    // (On gère le cas où c'est l'image par défaut du frontend)
    if ($user && strpos($user['avatar'], 'assets/') === false) {
        // C'est une image uploadée, on donne le chemin relatif vers backend
        $user['avatar'] = '../backend/uploads/' . $user['avatar'];
    }

    echo json_encode($user);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>