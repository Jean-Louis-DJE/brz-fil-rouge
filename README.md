# BREIZH4LINE - Moniteur de Consommation d'Eau

![Logo](frontend/frontend/assets/logo.png)

**BREIZH4LINE** est une application web progressive (PWA) conçue pour le suivi et l'analyse en temps réel de la consommation d'eau domestique. Ce projet, réalisé dans le cadre d'un fil rouge, combine une interface utilisateur intuitive avec un backend robuste pour aider les utilisateurs à comprendre, maîtriser et réduire leur consommation d'eau.

---

## 📋 Table des matières

1.  [✨ Fonctionnalités](#-fonctionnalités)
2.  [🛠️ Technologies utilisées](#-technologies-utilisées)
3.  [🚀 Installation et Démarrage](#-installation-et-démarrage)
    - [Prérequis](#prérequis)
    - [Installation Backend](#installation-backend)
    - [Installation Frontend](#installation-frontend)
4.  [🏗️ Structure du Projet](#-structure-du-projet)
5.  [📸 Captures d'écran (à ajouter)](#-captures-décran-à-ajouter)

---

## ✨ Fonctionnalités

*   **Tableau de Bord Principal** : Visualisation de la consommation totale en litres et du coût associé sur des périodes personnalisables.
*   **Graphiques Interactifs** :
    *   Historique détaillé de la consommation (graphique en ligne).
    *   Répartition de la consommation par point d'eau (graphique en camembert).
    *   Analyse des coûts par période (graphique en barres).
*   **Analyse & Objectifs** :
    *   Génération de bilans et de conseils personnalisés basés sur la consommation hebdomadaire.
    *   Création et suivi d'objectifs de réduction (ex: "Prendre des douches de 5 minutes").
*   **Qualification des Usages** : Possibilité de cliquer sur un pic de consommation pour l'associer à une activité (douche, vaisselle, arrosage), enrichissant ainsi les données.
*   **Gestion de Profil** : Personnalisation du profil utilisateur et des membres du foyer pour affiner les recommandations.
*   **Configuration des Capteurs** : Interface pour nommer les capteurs d'eau (ex: `00:1A:2B:3C:4D:01` → `Douche Parentale`).
*   **Design Mobile-First** : Une interface entièrement responsive, conçue pour une expérience optimale sur mobile et ordinateur.

---

## 🛠️ Technologies utilisées

### Frontend
*   **HTML5**
*   **CSS3** (avec variables CSS pour le theming)
*   **JavaScript (ES6+)** : Logique applicative, appels API (Fetch), manipulation du DOM.
*   **Chart.js** : Pour la création de graphiques dynamiques et interactifs.
*   **PWA (Progressive Web App)** : Inclut un `manifest.json` pour une installation sur l'écran d'accueil.

### Backend
*   **PHP 8+**
*   **API RESTful** : Endpoints PHP pour servir les données au frontend.
*   **MySQL / MariaDB** : Base de données relationnelle pour stocker les mesures, les configurations et les données utilisateur.
*   **PDO** : Pour des interactions sécurisées avec la base de données.

### Communication Hardware (Optionnel)
*   Le script `manage_ap_cred.php` est prévu pour communiquer avec un microcontrôleur (type ESP32/Raspberry Pi) via I²C en utilisant un script Python, afin de configurer les identifiants WiFi du capteur.

---

## 🚀 Installation et Démarrage

### Prérequis

*   Un serveur web local (Apache, Nginx, etc.) avec PHP 8 ou supérieur.
*   Un serveur de base de données MySQL ou MariaDB.
*   Un client MySQL (comme phpMyAdmin) ou un accès en ligne de commande.

### 1. Installation Backend

1.  **Clonez le dépôt** :
    ```bash
    git clone https://github.com/VOTRE_NOM/brz-fil-rouge.git
    cd brz-fil-rouge
    ```

2.  **Base de données** :
    *   Créez une base de données nommée `breizh4line`.
    *   Importez la structure de la base de données en utilisant le fichier `backend/backend/db.sql`.

3.  **Configuration** :
    *   Ouvrez le fichier `backend/backend/config.php` (s'il existe, sinon créez-le sur la base des autres fichiers) et ajustez les identifiants de connexion à votre base de données.
    ```php
    <?php
    // backend/backend/config.php
    $dbHost = 'localhost';
    $dbName = 'breizh4line';
    $dbUser = 'votre_utilisateur'; // Ex: root ou pmauser
    $dbPass = 'votre_mot_de_passe'; // Ex: MotDePasse123

    try {
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        die("Erreur de connexion à la base de données: " . $e->getMessage());
    }
    ?>
    ```

4.  **Peuplement de la base de données** :
    *   Pour générer des données de test réalistes, accédez à l'URL `http://localhost/path/to/backend/backend/seed_db.php` dans votre navigateur. Cela remplira la base de données avec 2 ans de données simulées.

### 2. Installation Frontend

1.  **Déplacez les fichiers** : Assurez-vous que le dossier `frontend` est accessible via votre serveur web.

2.  **Configuration de l'API** :
    *   Ouvrez le fichier `frontend/frontend/app.js`.
    *   Au début du fichier, vérifiez que la variable `API_BASE_URL` pointe vers le dossier `backend` de votre serveur.
    ```javascript
    const API_BASE_URL = 'http://localhost/path/to/backend/backend/';
    ```

3.  **Lancez l'application** : Ouvrez `http://localhost/path/to/frontend/frontend/index.html` dans votre navigateur.

---

## 🏗️ Structure du Projet

```
/
├── backend/         # Contient toute la logique serveur
│   ├── backend/
│   │   ├── api/     # (Suggestion) Endpoints de l'API
│   │   ├── config.php # Connexion BDD
│   │   ├── db.sql     # Structure de la BDD
│   │   └── seed_db.php# Script de peuplement
│   └── ...
├── frontend/        # Contient l'interface utilisateur
│   ├── frontend/
│   │   ├── assets/    # Images, logos, etc.
│   │   ├── app.js     # Logique JavaScript principale
│   │   ├── index.html # Fichier principal de l'application
│   │   ├── style.css  # Styles de l'application
│   │   └── manifest.json # Pour la PWA
│   └── ...
└── README.md        # Ce fichier
```

---

## 📸 Captures d'écran (à ajouter)

*(Insérez ici des captures d'écran de votre application pour la rendre plus attrayante)*

**Exemple de Tableau de bord :**
`[Image du tableau de bord]`

**Exemple d'analyse des coûts :**
`[Image de la page des coûts]`