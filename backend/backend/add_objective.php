<?php
function handle_add_objective() {
    global $pdo; // On importe la variable $pdo du fichier config.php

    // On récupère les données envoyées en POST
    $data = json_decode(file_get_contents('php://input'), true);

    // Validation simple
    if (!isset($data['name']) || !isset($data['target']) || !isset($data['unit'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Données manquantes.']);
        return;
    }

    $id_utilisateur = 1; // Pour l'instant, on code en dur l'utilisateur principal
    $nom_objectif = $data['name'];
    $valeur_cible = floatval($data['target']);
    $unite = $data['unit'];

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO objectifs (id_utilisateur, nom_objectif, valeur_cible, unite) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$id_utilisateur, $nom_objectif, $valeur_cible, $unite]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()]);
    }
}
include 'config.php';
handle_add_objective();
