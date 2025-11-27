<?php
header("Content-Type: application/json");
include "config.php";

$prenom = $_POST['prenom'] ?? '';
$nom = $_POST['nom'] ?? '';
$age = $_POST['age'] ?? null;     
$genre = $_POST['genre'] ?? null; 
$is_sportif = $_POST['is_sportif'] ?? 0;

try {
    // Insérer un nouvel utilisateur, l'ID sera auto-généré
    $stmt = $pdo->prepare("INSERT INTO utilisateur (prenom, nom, age, genre, is_sportif) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$prenom, $nom, $age, $genre, $is_sportif]);

    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>