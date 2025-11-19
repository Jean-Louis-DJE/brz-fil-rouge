<?php
header("Content-Type: application/json");
include "config.php";

// On ne peut pas utiliser json_decode(file_get_contents...) car on envoie des fichiers (Multipart)
// On utilise directement $_POST et $_FILES

$nom = $_POST['nom'] ?? '';
$prenom = $_POST['prenom'] ?? '';
$habitudes = $_POST['habitudes'] ?? '';
$sql_avatar = ""; // Morceau de SQL si on change l'image
$params = [$nom, $prenom, $habitudes];

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
    $sql = "UPDATE utilisateur SET nom = ?, prenom = ?, habitudes = ? $sql_avatar WHERE id = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>