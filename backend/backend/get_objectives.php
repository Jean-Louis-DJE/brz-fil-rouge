<?php
function handle_get_objectives() {
    global $pdo; // On importe la variable $pdo du fichier config.php

    $id_utilisateur = 1; // Pour l'instant, on code en dur l'utilisateur principal

    try {
        // On récupère les objectifs "En cours" pour l'utilisateur
        $stmt = $pdo->prepare("SELECT id, nom_objectif, valeur_cible, unite FROM objectifs WHERE id_utilisateur = ? AND statut = 'En cours' ORDER BY date_creation DESC");
        $stmt->execute([$id_utilisateur]);
        $objectives = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($objectives);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
    }
}
include 'config.php';
handle_get_objectives();
