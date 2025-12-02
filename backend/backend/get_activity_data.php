<?php
header('Content-Type: application/json');
include 'config.php'; // Utilise votre fichier de connexion existant

try {
    global $pdo;

    // 1. Récupérer toutes les activités et les grouper par capteur
    $stmt_activites = $pdo->query("SELECT code_activite, label, mac_capteur FROM activites ORDER BY mac_capteur, label");
    $activites_par_capteur = [];
    while ($row = $stmt_activites->fetch(PDO::FETCH_ASSOC)) {
        $activites_par_capteur[$row['mac_capteur']][] = [
            'value' => $row['code_activite'],
            'label' => $row['label']
        ];
    }

    // 2. Récupérer tout le contenu (infos et conseils)
    $stmt_contenu = $pdo->query("
        SELECT 
            a.code_activite, 
            c.type_contenu, 
            c.titre, 
            c.contenu 
        FROM contenu_activite c
        JOIN activites a ON c.id_activite = a.id
    ");
    $contenu_par_activite = [];
    while ($row = $stmt_contenu->fetch(PDO::FETCH_ASSOC)) {
        $contenu_par_activite[$row['code_activite']][$row['type_contenu']] = [
            'titre' => $row['titre'],
            'contenu' => $row['contenu']
        ];
    }

    // 3. Combiner les deux résultats dans une structure finale
    $response = [
        'activities' => $activites_par_capteur,
        'content' => $contenu_par_activite
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>
