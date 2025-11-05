CREATE DATABASE IF NOT EXISTS breizh4line CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE breizh4line;

CREATE TABLE consommation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_mesure DATETIME NOT NULL,
  valeur FLOAT NOT NULL
);
