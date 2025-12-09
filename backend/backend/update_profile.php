<?php
// backend/backend/update_profile.php
// Ce fichier met à jour le profil de l'utilisateur principal
header("Content-Type: application/json");
include "config.php";

// On ne peut pas utiliser json_decode(file_get_contents...) car on envoie des fichiers (Multipart)
// On utilise directement $_POST et $_FILES

$nom = $_POST['nom'] ?? '';
$prenom = $_POST['prenom'] ?? '';
$habitudes = $_POST['habitudes'] ?? '';
$age = $_POST['age'] ?? null;  
$genre = $_POST['genre'] ?? null;   
$is_sportif = isset($_POST['is_sportif']) && $_POST['is_sportif'] === 'on' ? 1 : 0;
$departement = $_POST['departement'] ?? null;

$sql_avatar = ""; 
$params = [$nom, $prenom, $habitudes, $age, $genre, $is_sportif, $departement]; 

// Gestion de l'image (si une nouvelle est envoyée)
if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
    $filename = "user_1_" . time() . "." . $ext; // Nom unique pour éviter le cache
    $destination = __DIR__ . "/uploads/" . $filename;

    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $destination)) {
        $sql_avatar = ", avatar = ?";
        $params[] = $filename;
    }
}

// Mise à jour en base
try {
    // Mise à jour de la requête SQL
    $sql = "UPDATE utilisateur SET nom = ?, prenom = ?, habitudes = ?, age = ?, genre = ?, is_sportif = ?, departement = ? $sql_avatar WHERE id = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>