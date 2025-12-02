<?php
// c:/xampp/htdocs/brz/backend/update_sensor_config.php
require 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données JSON invalides.']);
    exit;
}

// Couleurs prédéfinies pour l'attribution automatique
$colors = ['#0b67ff', '#ff8c1a', '#10bffd', '#4caf50', '#f44336', '#9c27b0', '#ffeb3b', '#795548'];
$colorIndex = 0;

try {
    $pdo->beginTransaction();

    // On prépare deux requêtes : une pour l'insertion, une pour la mise à jour
    $stmt_insert = $pdo->prepare(
        "INSERT INTO capteurs (adresse_mac, nom, couleur) VALUES (:mac, :nom, :couleur)
         ON DUPLICATE KEY UPDATE nom = :nom" // On ne touche pas à la couleur si la ligne existe
    );

    foreach ($input as $sensor) {
        $mac = $sensor['mac'];
        $name = trim($sensor['name']);

        // On ne traite que les capteurs qui ont un nom
        if (!empty($name)) {
            // Vérifier si le capteur a déjà une couleur
            $checkColorStmt = $pdo->prepare("SELECT couleur FROM capteurs WHERE adresse_mac = ?");
            $checkColorStmt->execute([$mac]);
            $existingColor = $checkColorStmt->fetchColumn();

            // Si pas de couleur, on en assigne une nouvelle. Sinon, on garde l'ancienne.
            $colorToUse = $existingColor ?: $colors[$colorIndex % count($colors)];

            $stmt_insert->execute([
                ':mac' => $mac,
                ':nom' => $name,
                ':couleur' => $colorToUse
            ]);
            if (!$existingColor) $colorIndex++; // On incrémente l'index uniquement si on a utilisé une nouvelle couleur
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
