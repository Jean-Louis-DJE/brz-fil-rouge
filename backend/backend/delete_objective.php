<?php
// backend/backend/delete_objective.php
// Ce fichier gère la suppression d'un objectif dans la base de données

header("Content-Type: application/json");
include "config.php"; 

// 1. Récupérer l'ID de l'objectif depuis les paramètres de l'URL
$objectiveId = $_GET['id'] ?? null;

// 2. Valider que l'ID est bien présent
if (!$objectiveId) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "ID de l'objectif manquant."]);
    exit;
}

try {
    // 3. Préparer et exécuter la requête de suppression de manière sécurisée
    $stmt = $pdo->prepare("DELETE FROM objectifs WHERE id = ?");
    $stmt->execute([$objectiveId]);

    // 4. Renvoyer une réponse de succès au frontend
    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    // 5. En cas d'erreur avec la base de données, renvoyer une erreur 500
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Erreur de base de données: " . $e->getMessage()]);
}
?>