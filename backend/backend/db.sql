-- Suppression de la base de données si elle existe pour repartir de zéro
-- ===================================================================
-- =============================================================================
-- SCRIPT DE STRUCTURE POUR LA BASE DE DONNÉES BREIZH4LINE
-- Ce script contient uniquement la structure des tables (CREATE TABLE).
-- Les données initiales sont insérées par le script `seed_db.php`.
-- =============================================================================

-- Pour utiliser ce script, assurez-vous d'avoir créé et sélectionné votre base :
-- CREATE DATABASE IF NOT EXISTS breizh4line;
-- USE breizh4line;

DROP DATABASE IF EXISTS breizh4line;
CREATE DATABASE IF NOT EXISTS breizh4line CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE breizh4line;

CREATE TABLE consommation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_mesure DATETIME NOT NULL,
  valeur FLOAT NOT NULL,
  adresse_mac_capteur VARCHAR(17) NOT NULL  
);

CREATE TABLE utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NULL,
  age INT NULL,
  genre VARCHAR(20) DEFAULT 'Non précisé',
  is_sportif TINYINT(1) DEFAULT 0, -- 0 pour non, 1 pour oui
  habitudes TEXT NULL,
  departement VARCHAR(3) NULL,
  avatar VARCHAR(255) NULL,
  is_main_user TINYINT(1) DEFAULT 0 -- 1 pour l'utilisateur principal
);

CREATE TABLE activites (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code_activite` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `mac_capteur` varchar(17) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_activite` (`code_activite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contenu_activite (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_activite` int(11) NOT NULL,
  `type_contenu` enum('info','conseil') NOT NULL,
  `titre` varchar(255) NOT NULL,
  `contenu` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_activite` (`id_activite`),
  CONSTRAINT `contenu_activite_ibfk_1` FOREIGN KEY (`id_activite`) REFERENCES `activites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table pour stocker les objectifs des utilisateurs
CREATE TABLE objectifs (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_utilisateur` INT NOT NULL,
  `nom_objectif` VARCHAR(100) NOT NULL,
  `valeur_cible` FLOAT NOT NULL,
  `unite` VARCHAR(10) NOT NULL, -- 'L' ou 'min'
  `statut` ENUM('En cours', 'Atteint', 'Échoué') DEFAULT 'En cours',
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_achevement` DATETIME NULL,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;