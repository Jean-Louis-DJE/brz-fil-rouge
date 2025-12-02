<?php
header("Content-Type: application/json");
include "config.php";

$data = json_decode(file_get_contents('php://input'), true);

$objectiveId = $data['id'] ?? null;
$finalValue = $data['finalValue'] ?? null;

if (!$objectiveId || $finalValue === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Données manquantes (id ou finalValue)."]);
    exit;
}

try {
    // On met à jour le statut à 'validé' et on enregistre la valeur réelle
    $stmt = $pdo->prepare(
        "UPDATE objectifs SET statut = 'validé', valeur_reelle = ? WHERE id = ?"
    );
    $stmt->execute([$finalValue, $objectiveId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Aucun objectif trouvé avec cet ID."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Erreur de base de données: " . $e->getMessage()]);
}
?>