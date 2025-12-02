<?php
include 'config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS habitudes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        motivation VARCHAR(255),
        logement VARCHAR(50),
        jardin TINYINT(1) DEFAULT 0,
        arrosage_auto TINYINT(1) DEFAULT 0,
        piscine VARCHAR(50),
        eau_boisson VARCHAR(50),
        douche_bain VARCHAR(50),
        duree_douche INT,
        lave_vaisselle TINYINT(1) DEFAULT 0,
        lave_vaisselle_freq INT,
        FOREIGN KEY (user_id) REFERENCES utilisateur(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "Table 'habitudes' créée avec succès.";
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}
?>