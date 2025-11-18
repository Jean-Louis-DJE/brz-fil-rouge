<?php
/**
 * ========================================
 * FILE: index.php (Login Page)
 * ========================================
 * 
 * PURPOSE:
 * - Page de connexion sécurisée pour WaterTrack
 * - Vérifie les identifiants (SSID + Mot de passe) dans la BD
 * - Crée une session sécurisée si correct
 * - Redirige vers main.html si authentification OK
 * 
 * SECURITY:
 * - Anti-cache headers pour éviter les problèmes de session
 * - Session regeneration à chaque chargement
 * - Vérification stricte du mot de passe (caractère par caractère)
 * - Log des tentatives échouées
 * ========================================
 */

// ============================================
// 1️⃣ ANTI-CACHE HEADERS
// ============================================
// Force le navigateur à TOUJOURS recharger la page
// (important pour la sécurité et les sessions)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

// ============================================
// 2️⃣ DÉMARRER LA SESSION
// ============================================
session_start();
session_regenerate_id(true); // Régénère l'ID de session à chaque fois

// ============================================
// 3️⃣ CONFIGURATION DE LA BASE DE DONNÉES
// ============================================
$host = "localhost";      // Serveur MySQL
$user = "pmauser";           // Utilisateur MySQL
$pass = "MotDePasse123";               // Mot de passe MySQL (vide par défaut)
$dbname = "breizh4line";  // Nom de la base de données

// ============================================
// 4️⃣ VÉRIFIER SI LA BASE DE DONNÉES EXISTE
// ============================================
// Si la base n'existe pas, rediriger vers install.php
// pour la créer automatiquement
// 
// 📌 POURQUOI ?
// - Au premier démarrage, la base n'existe pas
// - install.php crée la base + la table + les données par défaut
// - Après la première exécution de install.php, ce code ne s'exécute PLUS

$conn_check = new mysqli($host, $user, $pass);
if ($conn_check->connect_error) {
    die("❌ Erreur de connexion MySQL : " . $conn_check->connect_error);
}

// Vérifier si la base existe
$result = $conn_check->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbname'");

if ($result->num_rows == 0) {
    // Base n'existe pas → Rediriger vers install.php
    // 📌 Cette ligne s'exécute UNE SEULE FOIS au premier démarrage
    header("Location: install.php");
    exit;
}

$conn_check->close();

// ============================================
// 5️⃣ CONNEXION À LA BASE DE DONNÉES
// ============================================
$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("❌ Erreur de connexion : " . $conn->connect_error);
}

// Définir le charset (important pour les accents)
$conn->set_charset("utf8mb4");

// Variable pour stocker les messages d'erreur
$error = "";

// ============================================
// 6️⃣ VÉRIFIER SI L'UTILISATEUR EST DÉJÀ CONNECTÉ
// ============================================
// Si la session existe ET l'utilisateur est authentifié
if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    
    // Vérifier que l'utilisateur existe toujours en BD
    // (en cas de suppression par admin)
    $stmt = $conn->prepare("SELECT id FROM wifi_credentials WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // ✅ Session valide → Aller directement à main.html
        header("Location: main.html");
        exit;
    } else {
        // ❌ Utilisateur supprimé de la BD → Détruire la session
        session_destroy();
        $error = "Votre session n'est plus valide. Reconnexion requise.";
    }
    
    $stmt->close();
}

// ============================================
// 7️⃣ TRAITER LA SOUMISSION DU FORMULAIRE
// ============================================
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    
    // Récupérer et nettoyer les données du formulaire
    $ssid_input = trim($_POST["ssid"] ?? "");
    $pwd_input = trim($_POST["pwd"] ?? "");
    
    // Validation : Les deux champs doivent être remplis
    if (empty($ssid_input)) {
        $error = "Veuillez renseigner le SSID";
    } else if (empty($pwd_input)) {
        $error = "Veuillez renseigner le mot de passe";
    } else {
        
        // ============================================
        // 8️⃣ VÉRIFIER LES IDENTIFIANTS DANS LA BD
        // ============================================
        // Utiliser une requête préparée pour éviter les injections SQL
        $stmt = $conn->prepare("SELECT id, ssid, pwd FROM wifi_credentials WHERE ssid = ? LIMIT 1");
        
        if (!$stmt) {
            $error = "Erreur serveur : " . $conn->error;
        } else {
            // Bind le paramètre SSID
            $stmt->bind_param("s", $ssid_input);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                // SSID trouvé en BD
                $row = $result->fetch_assoc();
                $pwd_db = $row['pwd'];
                
                // Comparer le mot de passe entré avec celui en BD
                // 📌 Comparaison STRICTE (caractère par caractère)
                // Si tu changes le MDP en BD, l'ancien ne marche PLUS
                if ($pwd_input === $pwd_db) {
                    
                    // ✅ IDENTIFIANTS CORRECTS !
                    
                    // Détruire l'ancienne session (sécurité)
                    session_destroy();
                    session_start();
                    
                    // Créer une NOUVELLE session sécurisée
                    $_SESSION['authenticated'] = true;           // Flag d'authentification
                    $_SESSION['ssid'] = htmlspecialchars($row['ssid']); // SSID de l'utilisateur
                    $_SESSION['user_id'] = $row['id'];          // ID unique en BD
                    $_SESSION['login_time'] = time();           // Heure de connexion
                    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR']; // IP du client
                    
                    // Sauvegarder immédiatement la session
                    session_write_close();
                    
                    // Rediriger vers le dashboard
                    header("Location: main.html");
                    exit;
                    
                } else {
                    // ❌ MOT DE PASSE INCORRECT
                    $error = "SSID ou mot de passe incorrect";
                    
                    // Log la tentative échouée (sécurité)
                    $log_file = "/var/log/watertrack_login_attempts.log";
                    $log_msg = "[" . date('Y-m-d H:i:s') . "] ÉCHEC - SSID: " . htmlspecialchars($ssid_input) . " - IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
                    @file_put_contents($log_file, $log_msg, FILE_APPEND);
                }
            } else {
                // ❌ SSID N'EXISTE PAS EN BD
                $error = "SSID ou mot de passe incorrect";
                
                // Log la tentative échouée
                $log_file = "/var/log/watertrack_login_attempts.log";
                $log_msg = "[" . date('Y-m-d H:i:s') . "] ÉCHEC - SSID: " . htmlspecialchars($ssid_input) . " - IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
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
        /* ============================================
           DESIGN SYSTEM - Variables CSS
           Shared avec main.html pour cohérence visuelle
           ============================================ */
        :root {
            --bg: #f2f4f7;           /* Fond clair */
            --card: #ffffff;         /* Cartes blanches */
            --text: #0f172a;         /* Texte foncé */
            --muted: #64748b;        /* Texte grisé */
            --primary: #0b67ff;      /* Bleu principal */
            --accent: #10bffd;       /* Cyan accent */
            --shadow: 0 8px 24px rgba(15, 23, 42, 0.08); /* Ombre douce */
            --radius: 18px;          /* Coins arrondis */
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
        }

        body {
            font-family: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            color: var(--text);
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100dvh;
            padding: 16px;
        }

        /* Conteneur principal du formulaire */
        .login-container {
            width: 100%;
            max-width: 420px;
            background: var(--card);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 32px;
            animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Section logo et titre */
        .logo-section {
            text-align: center;
            margin-bottom: 32px;
        }

        .logo-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 16px;
            box-shadow: var(--shadow);
        }

        .logo-section h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 6px;
            color: var(--text);
        }

        .logo-section p {
            font-size: 14px;
            color: var(--muted);
        }

        /* Groupe de formulaire (label + input) */
        .form-group {
            margin-bottom: 18px;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Champs input */
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            font-family: inherit;
            background: #fafbfc;
            transition: all 0.2s ease;
            color: var(--text);
        }

        /* Focus state des inputs */
        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: var(--primary);
            background: var(--card);
            box-shadow: 0 0 0 3px rgba(11, 103, 255, 0.1);
        }

        input::placeholder {
            color: var(--muted);
        }

        /* Wrapper pour le bouton toggle de mot de passe */
        .password-wrapper {
            position: relative;
        }

        /* Bouton afficher/masquer mot de passe */
        .toggle-pwd {
            position: absolute;
            right: 12px;
            top: 38px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: var(--muted);
            padding: 4px;
            transition: color 0.2s;
            line-height: 1;
        }

        .toggle-pwd:hover {
            color: var(--primary);
        }

        /* Bouton de soumission */
        .submit-btn {
            width: 100%;
            padding: 12px 16px;
            background: linear-gradient(135deg, var(--primary), #0052e8);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(11, 103, 255, 0.3);
            margin-top: 8px;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(11, 103, 255, 0.4);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        /* Alerte d'erreur */
        .error-alert {
            background: #fee2e2;
            color: #991b1b;
            padding: 12px 14px;
            border-radius: 12px;
            font-size: 13px;
            margin-bottom: 20px;
            border-left: 4px solid #dc2626;
            animation: shake 0.3s ease-in-out;
        }

        @keyframes shake {
            0%, 100% {
                transform: translateX(0);
            }
            25% {
                transform: translateX(-4px);
            }
            75% {
                transform: translateX(4px);
            }
        }

        /* Carte d'information */
        .info-card {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            padding: 14px;
            margin-top: 20px;
            font-size: 13px;
            color: #1e40af;
            line-height: 1.5;
        }

        .info-card strong {
            display: block;
            margin-bottom: 6px;
            color: #0c2340;
            font-weight: 700;
        }

        /* Texte de footer */
        .footer-text {
            text-align: center;
            font-size: 11px;
            color: var(--muted);
            margin-top: 20px;
        }

        /* Responsive design */
        @media (max-width: 480px) {
            .login-container {
                padding: 24px;
            }

            .logo-section {
                margin-bottom: 24px;
            }

            .logo-section h1 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <!-- Logo et Titre -->
        <div class="logo-section">
            <div class="logo-icon">🔐</div>
            <h1>WaterTrack</h1>
            <p>Connexion Sécurisée</p>
        </div>

        <!-- Afficher les erreurs si présentes -->
        <?php if (!empty($error)): ?>
            <div class="error-alert">
                ⚠️ <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <!-- Formulaire de connexion -->
        <form method="POST" action="" novalidate>
            <!-- Champ SSID -->
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

            <!-- Champ Mot de passe -->
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
                    <!-- Bouton afficher/masquer -->
                    <button type="button" class="toggle-pwd" onclick="togglePassword(event)">👁️</button>
                </div>
            </div>

            <!-- Bouton de connexion -->
            <button type="submit" class="submit-btn">Se Connecter</button>
        </form>

        <!-- Carte d'information sécurité -->
        <div class="info-card">
            <strong>🔒 Sécurité</strong>
            Les identifiants sont vérifiés en temps réel directement depuis la base de données.
        </div>

        <!-- Footer -->
        <div class="footer-text">
            WaterTrack © 2024 — Interface Sécurisée
        </div>
    </div>

    <!-- ============================================
         JAVASCRIPT - Logique côté client
         ============================================ -->
    <script>
        /**
         * Afficher/Masquer le mot de passe
         * Change le type input entre "password" et "text"
         */
        function togglePassword(event) {
            event.preventDefault();
            const pwd = document.getElementById('pwd');
            const btn = event.target;
            
            if (pwd.type === 'password') {
                pwd.type = 'text';      // Afficher
                btn.textContent = '🙈'; // Emoji masqué
            } else {
                pwd.type = 'password';  // Masquer
                btn.textContent = '👁️'; // Emoji visible
            }
        }

        /**
         * Validation côté client
         * Vérifie que les deux champs sont remplis avant soumission
         */
        document.querySelector('form').addEventListener('submit', function(e) {
            const ssid = document.getElementById('ssid').value.trim();
            const pwd = document.getElementById('pwd').value.trim();
            
            if (!ssid || !pwd) {
                e.preventDefault();
                alert('Veuillez remplir tous les champs');
            }
        });
    </script>
</body>
</html>