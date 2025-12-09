<?php
// backend/backend/save_habits.php
// Ce fichier enregistre les habitudes de l'utilisateur dans la base de données
// Il attend une requête POST avec les données nécessaires
header("Content-Type: application/json");
include "config.php";

try {
    // 1. RÉCUPÉRATION ET SÉCURISATION DES DONNÉES
    
    // ID Utilisateur : On s'assure que c'est un entier. Par défaut 1 (Principal)
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 1;

    // Textes simples
    $motivation = $_POST['motivation'] ?? '';
    $logement   = $_POST['logement'] ?? '';
    $piscine    = $_POST['piscine'] ?? 'Non';
    $eau_boisson = $_POST['eau_boisson'] ?? '';
    $douche_bain = $_POST['douche_bain'] ?? '';

    // Cases à cocher (Booléens : 1 ou 0)
    // Le JS envoie '1' si coché, sinon la variable n'existe pas dans $_POST
    $jardin         = isset($_POST['jardin']) ? 1 : 0;
    $arrosage_auto  = isset($_POST['arrosage_auto']) ? 1 : 0;
    $lave_vaisselle = isset($_POST['lave_vaisselle']) ? 1 : 0;

    // Nombres (Durée, Fréquence)
    // On force la conversion en entier (int) pour éviter les erreurs SQL avec ""
    $duree_douche = !empty($_POST['duree_douche']) ? (int)$_POST['duree_douche'] : 0;
    $lave_vaisselle_freq = !empty($_POST['lave_vaisselle_freq']) ? (int)$_POST['lave_vaisselle_freq'] : 0;

    // VÉRIFICATION 1 : DUREE DOUCHE
    // La durée doit être un nombre valide avant d'être utilisée
    if (!is_numeric($duree_douche) || $duree_douche < 0 || $duree_douche > 60) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Durée de douche invalide."]);
        exit;
    }

    // VÉRIFICATION 2 : FRÉQUENCE LAVE-VAISSELLE
    if (!is_numeric($lave_vaisselle_freq) || $lave_vaisselle_freq < 0 || $lave_vaisselle_freq > 30) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Fréquence LV invalide."]);
        exit;
    }
    
    // 2. VÉRIFICATION : L'HABITUDE EXISTE-T-ELLE DÉJÀ ?
    $check = $pdo->prepare("SELECT id FROM habitudes WHERE user_id = ?");
    $check->execute([$user_id]);
    $exists = $check->fetch();

    // 3. INSERTION OU MISE À JOUR
    if ($exists) {
        // UPDATE (Mise à jour)
        $sql = "UPDATE habitudes SET 
                    motivation=?, logement=?, jardin=?, arrosage_auto=?, 
                    piscine=?, eau_boisson=?, douche_bain=?, duree_douche=?, 
                    lave_vaisselle=?, lave_vaisselle_freq=? 
                WHERE user_id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $motivation, $logement, $jardin, $arrosage_auto, 
            $piscine, $eau_boisson, $douche_bain, $duree_douche, 
            $lave_vaisselle, $lave_vaisselle_freq, 
            $user_id
        ]);
    } else {
        // INSERT (Création)
        $sql = "INSERT INTO habitudes (
                    motivation, logement, jardin, arrosage_auto, 
                    piscine, eau_boisson, douche_bain, duree_douche, 
                    lave_vaisselle, lave_vaisselle_freq, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $motivation, $logement, $jardin, $arrosage_auto, 
            $piscine, $eau_boisson, $douche_bain, $duree_douche, 
            $lave_vaisselle, $lave_vaisselle_freq, 
            $user_id
        ]);
    }

    echo json_encode(["success" => true]);

} catch (Exception $e) {
    // En cas de problème (ex: base de données inaccessible)
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>