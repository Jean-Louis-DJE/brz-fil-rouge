<?php
// backend/backend/seed_db.php
// Ce fichier insère des données de consommation d'eau dans la base de données

header('Content-Type: application/json');

include 'config.php'; // Utilise votre fichier de connexion existant

date_default_timezone_set('Europe/Paris');

// Adresses MAC simulées (correspondant à app.js)
const MAC_NAMES = [
    '00:1A:2B:3C:4D:01' => 'Douche',
    '00:1A:2B:3C:4D:02' => 'Lave-linge',
    '00:1A:2B:3C:4D:03' => 'Cuisine',
    '00:1A:2B:3C:4D:04' => 'Robinet Ext.'
];
$mac_addresses = array_keys(MAC_NAMES);

// Scénario réaliste pour une journée type de la semaine en cours
$dailyScenario = [
    // Matin
    ['hour' => 7, 'mac' => '00:1A:2B:3C:4D:01', 'liters' => 60, 'comment' => 'Douche matin 1'],
    ['hour' => 8, 'mac' => '00:1A:2B:3C:4D:01', 'liters' => 55, 'comment' => 'Douche matin 2'],
    ['hour' => 8, 'mac' => '00:1A:2B:3C:4D:03', 'liters' => 5,  'comment' => 'Café / Petit déjeuner'],
    
    // Journée
    ['hour' => 11, 'mac' => '00:1A:2B:3C:4D:02', 'liters' => 50, 'comment' => 'Lave-linge'],
    ['hour' => 13, 'mac' => '00:1A:2B:3C:4D:03', 'liters' => 10, 'comment' => 'Cuisine repas midi'],

    // Soir
    ['hour' => 19, 'mac' => '00:1A:2B:3C:4D:03', 'liters' => 15, 'comment' => 'Cuisine repas soir'],
    ['hour' => 21, 'mac' => '00:1A:2B:3C:4D:03', 'liters' => 25, 'comment' => 'Vaisselle'],

    // Divers
    ['hour' => 18, 'mac' => '00:1A:2B:3C:4D:04', 'liters' => 30, 'comment' => 'Arrosage jardin (aléatoire)']
];

try {
    // La variable $pdo est maintenant disponible grâce à config.php

    // --- ÉTAPE 1 : Vider toutes les tables pour un nouveau départ (dans le bon ordre) ---
    echo "Vidage des tables...\n";
    // On désactive temporairement les contraintes de clé étrangère pour vider
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE contenu_activite");
    $pdo->exec("TRUNCATE TABLE activites");
    $pdo->exec("TRUNCATE TABLE utilisateur");
    $pdo->exec("TRUNCATE TABLE capteurs"); // On vide aussi la table capteurs
    $pdo->exec("TRUNCATE TABLE sensor_data");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    echo "Tables vidées.\n";

    // --- ÉTAPE 2 : Insertion des données statiques (utilisateurs, activités, contenu) ---
    echo "Insertion des données de base (utilisateurs, activités, conseils)...\n";
    include 'set_data_static.php'; // On inclut le fichier de données statiques
    echo "Données de base insérées.\n";

    // --- ÉTAPE 3 : Insertion de la configuration des capteurs ---
    echo "Insertion de la configuration des capteurs...\n";
    $colors = ['#0b67ff', '#ff8c1a', '#10bffd', '#4caf50', '#f44336', '#9c27b0', '#ffeb3b', '#795548'];
    $colorIndex = 0;
    $stmt_capteurs = $pdo->prepare("INSERT INTO capteurs (adresse_mac, nom, couleur) VALUES (?, ?, ?)");
    foreach (MAC_NAMES as $mac => $name) {
        $stmt_capteurs->execute([$mac, $name, $colors[$colorIndex % count($colors)]]);
        $colorIndex++;
    }
    echo "Configuration des capteurs insérée.\n";


    // Démarrer une transaction pour améliorer massivement les performances d'insertion
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO sensor_data (value, date_mesure, sender_id) VALUES (?, ?, ?)");

    // --- PHASE 1: Génération des données historiques (2 ans jusqu'au début de l'année en cours) ---
    $historyStartDate = new DateTime('2 years ago');
    $currentYearStartDate = new DateTime('first day of january this year');
    
    $period = new DatePeriod($historyStartDate, new DateInterval('P1D'), $currentYearStartDate);
    $totalHistoricEntries = 0;

    echo "Génération des données historiques...\n";
    foreach ($period as $date) {
        // Générer une seule entrée de consommation totale pour la journée
        $dailyTotalConsumption = rand(250, 500); // Consommation journalière totale entre 250L et 500L
        
        // On stocke la donnée à midi pour représenter la journée
        $dataDate = (clone $date)->setTime(12, 0, 0);
        
        // On assigne cette consommation à un capteur aléatoire (ou on pourrait créer un capteur "général")
        $randomMac = $mac_addresses[array_rand($mac_addresses)];

        $stmt->execute([$dailyTotalConsumption, $dataDate->format('Y-m-d H:i:s'), $randomMac]);
        $totalHistoricEntries++;
    }
    echo "$totalHistoricEntries entrées historiques générées.\n";


    // --- PHASE 2: Génération des données détaillées pour l'année en cours (jusqu'à aujourd'hui) ---
    $today = new DateTime(); // Date du jour
    $currentWeekStartDate = new DateTime('monday this week'); // Date de début de la semaine actuelle
    $currentYearPeriod = new DatePeriod($currentYearStartDate, new DateInterval('P1D'), $currentWeekStartDate); // La période s'arrête au début de cette semaine
    $totalCurrentYearEntries = 0;

    echo "Génération des données détaillées pour l'année en cours (jusqu'à la semaine dernière)...\n";
    foreach ($currentYearPeriod as $day) {
        // Ne pas générer de données pour le futur
        if ($day > $today) {
            continue;
        }

        // Créer un tableau pour agréger la consommation par heure
        $hourlyConsumption = array_fill(0, 24, []);

        foreach ($dailyScenario as $event) {
            $literVariation = 1 + (rand(-15, 15) / 100); // variation de +/- 15%
            $finalLiters = round($event['liters'] * $literVariation, 2);

            // Pour l'arrosage, ne le faire que 3 fois par semaine environ
            if ($event['comment'] === 'Arrosage jardin (aléatoire)' && rand(1, 7) > 3) {
                continue;
            }

            // Agréger les litres par heure et par MAC
            $hour = $event['hour'];
            if (!isset($hourlyConsumption[$hour][$event['mac']])) {
                $hourlyConsumption[$hour][$event['mac']] = 0;
            }
            $hourlyConsumption[$hour][$event['mac']] += $finalLiters;
        }

        // Insérer les données agrégées par heure dans la BDD
        foreach ($hourlyConsumption as $hour => $macData) {
            $eventDate = (clone $day)->setTime($hour, 0, 0); // Date à l'heure pile
            if ($eventDate > $today) continue; // Ne pas insérer de données dans le futur
            
            foreach ($macData as $mac => $totalLiters) {
                $stmt->execute([$totalLiters, $eventDate->format('Y-m-d H:i:s'), $mac]);
                $totalCurrentYearEntries++;
            }
        }
    }
    echo "$totalCurrentYearEntries entrées détaillées générées pour l'année en cours.\n";

    // Valider la transaction : toutes les données sont insérées d'un coup
    $pdo->commit();


    $total = $totalHistoricEntries + $totalCurrentYearEntries;
    echo "\nTerminé ! $total enregistrements ont été insérés dans la base de données.\n";
    
    // Renvoyer une réponse JSON de succès
    echo json_encode(['success' => true, 'message' => "$total enregistrements insérés."]);

} catch (PDOException $e) {
    // En cas d'erreur, annuler la transaction pour ne rien insérer
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    // En cas d'erreur, annuler la transaction pour ne rien insérer
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur générale: ' . $e->getMessage()]);
}
?>
?>
