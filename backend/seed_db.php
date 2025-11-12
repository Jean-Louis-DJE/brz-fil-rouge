<?php
// backend/seed_db.php

// Le temps d'exécution peut être long pour 1500 requêtes
set_time_limit(300); 

header("Content-Type: text/plain");
include "config.php";

echo "--- Initialisation de la base de données de simulation ---\n";

// Définir la période de simulation : 30 jours se terminant hier
$jours_simulation = 30;
$date_fin = strtotime('yesterday'); 
$date_debut = strtotime("-$jours_simulation days", $date_fin);

$valeur_de_base_par_jour = 100; // Simule 100 événements par jour
$total_enregistrements = 0;

// Préparer l'insertion unique (plus rapide que de le faire dans la boucle)
$stmt = $pdo->prepare("INSERT INTO consommation (date_mesure, valeur) VALUES (?, ?)");

// Boucle sur chaque jour de la période
for ($timestamp_jour = $date_debut; $timestamp_jour <= $date_fin; $timestamp_jour = strtotime('+1 day', $timestamp_jour)) {
    
    $compteur_jour = 0;
    
    // Simuler des mesures régulières (environ toutes les 1h-1h30)
    for ($i = 0; $i < 20; $i++) {
        $heure_seconde = $timestamp_jour + mt_rand(0, 86400); // Temps aléatoire dans la journée
        $valeur = mt_rand(10, 30) / 10; // Volume entre 1.0 L et 3.0 L
        
        $date_mysql = date('Y-m-d H:i:s', $heure_seconde);
        
        $stmt->execute([$date_mysql, $valeur]);
        $compteur_jour++;
    }

    // Simuler des 'pics' de consommation (ex: douche ou machine à laver)
    for ($i = 0; $i < 3; $i++) {
        $heure_seconde = $timestamp_jour + mt_rand(0, 86400); 
        $valeur = mt_rand(50, 150) / 10; // Volume entre 5.0 L et 15.0 L
        
        $date_mysql = date('Y-m-d H:i:s', $heure_seconde);
        
        $stmt->execute([$date_mysql, $valeur]);
        $compteur_jour++;
    }

    $total_enregistrements += $compteur_jour;
    echo "Jour " . date('Y-m-d', $timestamp_jour) . " : $compteur_jour enregistrements\n";
}

echo "\n--- TERMINÉ. $total_enregistrements lignes insérées. ---\n";
?>