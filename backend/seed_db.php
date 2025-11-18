<?php
// backend/seed_db.php

// Le temps d'exécution peut être long pour plusieurs requêtes
set_time_limit(600); // Augmenté à 10 minutes si le serveur est lent

header("Content-Type: text/plain");
include "config.php";

echo "--- Initialisation de la base de données de simulation (2 ANS de données) ---\n";

// Adresses MAC de simulation (comme précédemment)
$mac_sensors = [
    '00:1A:2B:3C:4D:01', // Capteur 1 : Douche (HIGH)
    '00:1A:2B:3C:4D:03', // Capteur 2 : Évier Cuisine (MEDIUM-HIGH)
    '00:1A:2B:3C:4D:02', // Capteur 3 : Lave-linge (MEDIUM-LOW)
    '00:1A:2B:3C:4D:04'  // Capteur 4 : Robinet Extérieur (LOW)
];

// Définition des volumes d'insertion (Valeurs DISPARATES - inchangées)
$volume_ranges = [
    '00:1A:2B:3C:4D:01' => ['reg_min' => 600, 'reg_max' => 800, 'peak_min' => 1500, 'peak_max' => 2500], // Douche
    '00:1A:2B:3C:4D:03' => ['reg_min' => 300, 'reg_max' => 400, 'peak_min' => 800, 'peak_max' => 1200], // Cuisine
    '00:1A:2B:3C:4D:02' => ['reg_min' => 200, 'reg_max' => 300, 'peak_min' => 600, 'peak_max' => 1000], // Lave-linge
    '00:1A:2B:3C:4D:04' => ['reg_min' => 100, 'reg_max' => 200, 'peak_min' => 300, 'peak_max' => 500],  // Extérieur
];


// Définir la période de simulation : 2 ans (730 jours) se terminant hier
$jours_simulation = 730; // MODIFIÉ : 2 ans
$date_fin = strtotime('yesterday'); 
$date_debut = strtotime("-$jours_simulation days", $date_fin);

$total_enregistrements = 0;
$stmt = $pdo->prepare("INSERT INTO consommation (date_mesure, valeur, adresse_mac_capteur) VALUES (?, ?, ?)");

// Boucle sur chaque jour de la période
for ($timestamp_jour = $date_debut; $timestamp_jour <= $date_fin; $timestamp_jour = strtotime('+1 day', $timestamp_jour)) {
    
    $compteur_jour_total = 0;
    
    // Optionnel : Ajouter une légère variation saisonnière (plus de consommation l'été pour l'extérieur)
    $mois = (int)date('n', $timestamp_jour);
    $facteur_saison = ($mois >= 6 && $mois <= 8) ? 1.2 : 1.0; 

    // Boucle sur chaque capteur
    foreach ($mac_sensors as $mac_address) {
        
        $range = $volume_ranges[$mac_address];
        
        // --- 1. Mesures régulières (15 événements) ---
        for ($i = 0; $i < 15; $i++) {
            $heure_seconde = $timestamp_jour + mt_rand(0, 86400); 
            $valeur = mt_rand($range['reg_min'], $range['reg_max']) / 10; 
            
            // Appliquer la saisonnalité (si Robinet Extérieur)
            if ($mac_address === '00:1A:2B:3C:4D:04') {
                $valeur *= $facteur_saison;
            }
            
            $date_mysql = date('Y-m-d H:i:s', $heure_seconde);
            $stmt->execute([$date_mysql, $valeur, $mac_address]);
            $compteur_jour_total++;
        }

        // --- 2. Pics de consommation (2 pics) ---
        for ($i = 0; $i < 2; $i++) {
            $heure_seconde = $timestamp_jour + mt_rand(0, 86400); 
            $valeur = mt_rand($range['peak_min'], $range['peak_max']) / 10; 
            
            // Appliquer la saisonnalité (si Robinet Extérieur)
            if ($mac_address === '00:1A:2B:3C:4D:04') {
                $valeur *= $facteur_saison;
            }

            $date_mysql = date('Y-m-d H:i:s', $heure_seconde);
            $stmt->execute([$date_mysql, $valeur, $mac_address]);
            $compteur_jour_total++;
        }
    }

    $total_enregistrements += $compteur_jour_total;
    echo "Jour " . date('Y-m-d', $timestamp_jour) . " : " . $compteur_jour_total . " enregistrements\n";
}

echo "\n--- TERMINÉ. $total_enregistrements lignes insérées pour 2 ans. ---\n";
?>