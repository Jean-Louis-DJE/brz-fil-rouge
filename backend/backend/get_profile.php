<?php
/**
 * get_profile.php
 * 
 * This script retrieves the user profile data.
 */

// Set the content type of the response to JSON
header('Content-Type: application/json');
include 'config.php';

try {
    // La variable $pdo est déjà dans le scope global grâce à l'include
    $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE is_main_user = 1 LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Utilisateur principal non trouvé.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
}
?>