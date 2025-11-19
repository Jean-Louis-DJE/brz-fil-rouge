<?php
// === Configuration de la base de données ===
$host = "localhost";        // ou "127.0.0.1"
$user = "pmauser";               // utilisateur MySQL
$pass = "MotDePasse123"; // mot de passe MySQL
$dbname = "breizh4line";

// Connexion à la base
$conn = new mysqli($host, $user, $pass, $dbname);

// Vérifie la connexion
if ($conn->connect_error) {
    die("Erreur de connexion à la base de données : " . $conn->connect_error);
}

// === Traitement du formulaire ===
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $ssid = trim($_POST["ssid"]);
    $pwd = trim($_POST["pwd"]); // peut être vide
    $note = "Ajout via interface web";

    if (!empty($ssid)) {
        // Prépare la requête d'insertion
        $stmt = $conn->prepare("INSERT INTO wifi_credentials (ssid, pwd, note, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("sss", $ssid, $pwd, $note);

        if ($stmt->execute()) {
            echo "<p style='color: green;'>✅ Identifiants Wi-Fi enregistrés avec succès.</p>";
            // Appel du fichier manage_ap_cred.php
            include_once("/var/www/html/backend/manage_ap_cred.php");
        } else {
            echo "<p style='color: red;'>❌ Erreur lors de l’enregistrement : " . $stmt->error . "</p>";
        }

        $stmt->close();
    } else {
        echo "<p style='color: red;'>Veuillez renseigner le nom du réseau (SSID).</p>";
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Configuration Wi-Fi</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #eef2f3;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .container {
            background-color: white;
            padding: 25px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            width: 320px;
            text-align: center;
        }
        input[type="text"], input[type="password"] {
            width: 90%;
            padding: 10px;
            margin: 8px 0;
            border: 1px solid #aaa;
            border-radius: 6px;
        }
        button {
            background-color: #0078D4;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        button:hover {
            background-color: #005fa3;
        }
        .info {
            font-size: 0.9em;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Configurer le Wi-Fi</h2>
        <form method="POST" action="">
            <input type="text" name="ssid" placeholder="Nom du réseau (SSID)" required><br>
            <input type="password" name="pwd" placeholder="Mot de passe (laisser vide si ouvert)"><br>
            <button type="submit">Valider</button>
        </form>
        <p class="info">Le mot de passe peut être laissé vide pour un réseau ouvert.</p>
    </div>
</body>
</html>
