<?php
// ========================================
// FICHIER 1 : index.php (Login SANS CACHE)
// ========================================

// 🚀 ANTI-CACHE ABSOLUE - TU PEUX PAS CONTOURNER
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

session_start();
session_regenerate_id(true); // Régénérer l'ID à chaque chargement

// === Configuration BD ===
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "breizh4line";    

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("❌ Erreur de connexion : " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

$error = "";

// === Détruire la session actuelle pour forcer nouvelle authentification ===
if (isset($_GET['fresh'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}

// === Si déjà connecté, aller à main.php ===
if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    // ⚠️ VÉRIFIER QUE LA SESSION EST TOUJOURS VALIDE DANS LA BD
    $stmt = $conn->prepare("SELECT id FROM wifi_credentials WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Session valide, aller à main.php
        header("Location: main.html");
        exit;
    } else {
        // Utilisateur n'existe plus, détruire la session
        session_destroy();
        $error = "❌ Votre session n'est plus valide. Reconnexion requise.";
    }
    $stmt->close();
}

// === Traitement du formulaire de login ===
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    
    $ssid_input = trim($_POST["ssid"] ?? "");
    $pwd_input = trim($_POST["pwd"] ?? "");
    
    // === Validation basique ===
    if (empty($ssid_input)) {
        $error = "❌ Veuillez renseigner le SSID";
    } else if (empty($pwd_input)) {
        $error = "❌ Veuillez renseigner le mot de passe";
    } else {
        
        // === VÉRIFIER EXACTEMENT EN BD - SANS CACHE ===
        // On force une nouvelle requête sans cache
        $stmt = $conn->prepare("SELECT id, ssid, pwd FROM wifi_credentials WHERE ssid = ? LIMIT 1");
        
        if (!$stmt) {
            $error = "❌ Erreur serveur : " . $conn->error;
        } else {
            $stmt->bind_param("s", $ssid_input);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $pwd_db = $row['pwd'];
                
                // ✅ Comparer EXACTEMENT - caractère par caractère
                if ($pwd_input === $pwd_db) {
                    // ✅ IDENTIFIANTS CORRECTS !
                    
                    // Détruire l'ancienne session
                    session_destroy();
                    session_start();
                    
                    // Créer une NOUVELLE session
                    $_SESSION['authenticated'] = true;
                    $_SESSION['ssid'] = htmlspecialchars($row['ssid']);
                    $_SESSION['user_id'] = $row['id'];
                    $_SESSION['login_time'] = time();
                    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'];
                    $_SESSION['created_at'] = date('Y-m-d H:i:s');
                    
                    // Sauvegarder immédiatement
                    session_write_close();
                    
                    // Aller à main.php
                    header("Location: main.html");
                    exit;
                    
                } else {
                    // ❌ MOT DE PASSE INCORRECT
                    $error = "❌ SSID ou mot de passe incorrect";
                    
                    // Log la tentative
                    $log_file = "/var/log/watertrack_login_attempts.log";
                    $log_msg = "[" . date('Y-m-d H:i:s') . "] ÉCHEC - SSID: " . htmlspecialchars($ssid_input) . " - IP: " . $_SERVER['REMOTE_ADDR'] . " - Le mot de passe ne correspond pas\n";
                    @file_put_contents($log_file, $log_msg, FILE_APPEND);
                }
            } else {
                // ❌ SSID N'EXISTE PAS
                $error = "❌ SSID ou mot de passe incorrect";
                
                // Log la tentative
                $log_file = "/var/log/watertrack_login_attempts.log";
                $log_msg = "[" . date('Y-m-d H:i:s') . "] ÉCHEC - SSID: " . htmlspecialchars($ssid_input) . " - IP: " . $_SERVER['REMOTE_ADDR'] . " - SSID introuvable\n";
                @file_put_contents($log_file, $log_msg, FILE_APPEND);
            }
            
            $stmt->close();
        }
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - WaterTrack</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 420px;
            width: 100%;
            padding: 45px 35px;
            animation: slideIn 0.6s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .logo {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            color: white;
            font-size: 35px;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        h1 {
            color: #333;
            font-size: 28px;
            text-align: center;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .subtitle {
            color: #999;
            font-size: 14px;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 500;
        }

        .alert {
            padding: 14px 16px;
            border-radius: 10px;
            margin-bottom: 25px;
            font-size: 14px;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            animation: shake 0.3s ease-in-out;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .form-group {
            margin-bottom: 22px;
        }

        label {
            display: block;
            color: #555;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 13px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            transition: all 0.3s ease;
            font-family: inherit;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        input::placeholder {
            color: #bbb;
        }

        .password-wrapper {
            position: relative;
        }

        .toggle-pwd {
            position: absolute;
            right: 14px;
            top: 40px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: #999;
            padding: 4px;
            transition: color 0.2s;
        }

        .toggle-pwd:hover {
            color: #667eea;
        }

        button {
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        .security-info {
            background: #e7f3ff;
            border-left: 4px solid #0066cc;
            padding: 14px 16px;
            border-radius: 8px;
            font-size: 12px;
            color: #0066cc;
            margin-top: 25px;
            line-height: 1.6;
        }

        .security-info strong {
            color: #003399;
            display: block;
            margin-bottom: 6px;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #999;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        @media (max-width: 480px) {
            .container {
                padding: 35px 25px;
            }

            h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔐</div>
        <h1>WaterTrack</h1>
        <p class="subtitle">Connexion Sécurisée</p>

        <?php if (!empty($error)): ?>
            <div class="alert">
                <span>⚠️</span>
                <span><?php echo $error; ?></span>
            </div>
        <?php endif; ?>

        <form method="POST" action="" novalidate>
            <div class="form-group">
                <label for="ssid">📶 SSID Réseau</label>
                <input 
                    type="text" 
                    id="ssid" 
                    name="ssid" 
                    placeholder="Nom du réseau"
                    required
                    autocomplete="off"
                >
            </div>

            <div class="form-group">
                <label for="pwd">🔑 Mot de Passe</label>
                <div class="password-wrapper">
                    <input 
                        type="password" 
                        id="pwd" 
                        name="pwd" 
                        placeholder="Votre mot de passe"
                        required
                        autocomplete="off"
                    >
                    <button type="button" class="toggle-pwd" onclick="togglePassword(event)">👁️</button>
                </div>
            </div>

            <button type="submit">🔓 Se Connecter</button>
        </form>

        <div class="security-info">
            <strong>🔒 Sécurité :</strong>
            Les identifiants sont vérifiés en temps réel. Chaque tentative est enregistrée.
        </div>

        <div class="footer">
            WaterTrack © 2024 - Tous droits réservés
        </div>
    </div>

    <script>
        function togglePassword(event) {
            event.preventDefault();
            const pwd = document.getElementById('pwd');
            const btn = event.target;
            if (pwd.type === 'password') {
                pwd.type = 'text';
                btn.textContent = '🙈';
            } else {
                pwd.type = 'password';
                btn.textContent = '👁️';
            }
        }

        document.querySelector('form').addEventListener('submit', function(e) {
            const ssid = document.getElementById('ssid').value.trim();
            const pwd = document.getElementById('pwd').value.trim();
            
            if (!ssid || !pwd) {
                e.preventDefault();
                alert('❌ Veuillez remplir tous les champs');
            }
        });
    </script>
</body>
</html>