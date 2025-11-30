<?php
// === Configuration base de données ===
$host = "localhost";       // ou adresse du serveur MySQL
$dbname = "breizh4line";
$username = "pmauser";        // utilisateur MySQL
$password = "MotDePasse123";            // mot de passe MySQL

// === Connexion à la base ===
try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    die("Erreur de connexion à la base : " . $e->getMessage());
}

function log_message($msg){
        $logfile = '/var/log/sensor_log.log';
        $line = "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
        file_put_contents($logfile, $line, FILE_APPEND | LOCK_EX);
}

// === Récupération des données envoyées ===
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // On récupère la valeur envoyée
    $value = isset($_POST['value']) ? intval($_POST['value']) : null;
        log_message("\n\n [AFFICHEUR] valeur reçue : $value") ;
        //echo   >> /var/log/apache2/access.log 2>&1;
    // On identifie l'expéditeur (au choix)
    // Option 1 : IP de l’appareil
    //$sender_id = $_SERVER['REMOTE_ADDR'];

    // Option 2 : un champ 'device_id' si tu veux l’envoyer depuis l’ESP
    $sender_id = $_POST['device_id'] ?? $_SERVER['REMOTE_ADDR'];

    if ($value === null) {
        http_response_code(400);
        echo "Aucune donnée reçue.";
        exit;
    }

    // === Insertion dans la base ===
    try {
        $stmt = $conn->prepare("INSERT INTO sensor_data (sender_id, value, date_mesure) VALUES (:sender_id, :value, NOW())");
        $stmt->execute([
            ':sender_id' => $sender_id,
            ':value' => $value,
            // NOW() est géré directement par SQL, pas besoin de le lier ici.
        ]);

        http_response_code(200);
        echo "Donnée enregistrée : $value (par $sender_id)";
    } catch (PDOException $e) {
        http_response_code(500);
        echo "Erreur SQL : " . $e->getMessage();
    }
} else {
    http_response_code(405);
    echo "Méthode non autorisée.";
}
?>