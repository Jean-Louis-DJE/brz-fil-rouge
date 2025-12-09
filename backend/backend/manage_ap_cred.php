<?php
// backend/backend/manage_ap_cred.php
// Ce fichier gère l'envoi des identifiants WiFi à un script Python via I²C
// Il est utilisé pour configurer les identifiants WiFi sur un appareil via I²C

$dbHost = 'localhost';
$dbName = 'breizh4line';   
$dbUser = 'pmauser';    
$dbPass = 'MotDePasse123';     
$pythonScript = '/var/www/html/backend/com_with_aff.py'; 
$pythonBin = '/usr/bin/python3'; 

header('Content-Type: text/html; charset=utf-8');

try {
    
    $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo "<pre>Erreur connexion DB : " . htmlspecialchars($e->getMessage()) . "</pre>";
    exit;
}

// Si un id est fourni en GET, on l'utilise ; sinon on prend le dernier enregistrement
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id > 0) {
    $stmt = $pdo->prepare("SELECT ssid, pwd FROM wifi_credentials WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
} else {
    $stmt = $pdo->query("SELECT ssid, pwd FROM wifi_credentials ORDER BY created_at DESC, id DESC LIMIT 1");
    $row = $stmt->fetch();
}

if (!$row) {
    echo "<pre>Aucun enregistrement trouvé dans la base de données.</pre>";
    exit;
}

$ssid = $row['ssid'];
$pwd  = $row['pwd'];

// Sécurité : vérifier la présence du script Python
if (!file_exists($pythonScript) || !is_executable($pythonScript)) {
    echo "<pre>Script Python introuvable ou non exécutable : $pythonScript\n";
    echo "Assure-toi que le fichier existe et a les droits d'exécution (chmod +x).</pre>";
    exit;
}

// Échapper les arguments pour la ligne de commande
$ssidArg = escapeshellarg($ssid);
$pwdArg  = escapeshellarg($pwd);

// Construire la commande (redirige STDERR vers STDOUT)
$cmd = escapeshellcmd($pythonBin) . " " . escapeshellarg($pythonScript) . " $ssidArg $pwdArg 2>&1";

// Optionnel : journalisation locale côté serveur (décommenter si utile)
// file_put_contents('/var/log/send_wifi_db.log', date('c') . " - CMD: $cmd\n", FILE_APPEND);

// Exécuter la commande et récupérer la sortie
$output = shell_exec($cmd);

// Afficher un rapport simple
echo "<h2>Envoi WiFi via I²C</h2>";
echo "<p><strong>SSID:</strong> " . htmlspecialchars($ssid) . "</p>";
echo "<p><strong>Mot de passe:</strong> " . htmlspecialchars($pwd) . "</p>";
echo "<h3>Résultat du script Python :</h3>";
echo "<pre>" . htmlspecialchars($output) . "</pre>";
?>
