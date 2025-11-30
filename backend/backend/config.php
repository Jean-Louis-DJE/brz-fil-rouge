<?php
// Paramètres de connexion MySQL
$host = "localhost";   // ou "127.0.0.1"
$user = "root";        // ton nom d’utilisateur MySQL
$pass = "";            // ton mot de passe MySQL
$db   = "breizh4line"; // nom de ta base

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur connexion BD: " . $e->getMessage()]);
    exit;
}
?>
