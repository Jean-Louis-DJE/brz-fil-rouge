<?php
include 'config.php';

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

    // Récupérer l'ID de l'utilisateur principal
    $stmtUser = $pdo->prepare("SELECT id FROM utilisateur WHERE is_main_user = 1 LIMIT 1");
    $stmtUser->execute();
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur principal introuvable. Veuillez créer un profil.']);
        return;
    }
    
    $id_utilisateur = $user['id'];
    $nom_objectif = $data['name'];
    $valeur_cible = floatval($data['target']);
    $unite = $data['unit'];

    try {
        // Le statut par défaut est 'En cours'
        $stmt = $pdo->prepare(
            "INSERT INTO objectifs (id_utilisateur, nom_objectif, valeur_cible, unite, statut) VALUES (?, ?, ?, ?, 'En cours')"
        );
        $stmt->execute([$id_utilisateur, $nom_objectif, $valeur_cible, $unite]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    }
}

handle_add_objective();
