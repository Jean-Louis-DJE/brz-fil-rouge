<?php
// backend/backend/config.php
// Ce fichier gère la connexion à la base de données MySQL

// Paramètres de connexion MySQL
$host = "localhost";   // ou "127.0.0.1"
$user = "root";        // ton nom d’utilisateur MySQL
$pass = "";            // ton mot de passe MySQL
$db   = "breizh4line"; // nom de ta base

try {
    // Création de la connexion PDO
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur connexion BD: " . $e->getMessage()]);
    exit;
}
?>

