<?php
/**
 * get_profile.php
 * 
 * This script retrieves the user profile data.
 * In a real application, this data would come from a database.
 * For now, it returns a static JSON object with sample data.
 */

// Set the content type of the response to JSON
header('Content-Type: application/json');

// In a real application, you would:
// 1. Connect to your database.
// 2. Get the current user's ID (e.g., from a session).
// 3. Query the database for that user's profile information.
// 4. Query for the household members associated with that user.

// For demonstration purposes, we'll use a hardcoded associative array.
$profile_data = [
    'prenom' => 'Jean',
    'nom' => 'Dupont',
    'habitudes' => 'Je prends une douche par jour et j\'utilise le lave-linge 3 fois par semaine.',
    'sportif' => true,
    'departement' => '35',
    'avatar' => 'assets/avatar.png', // Path to the user's avatar
    'membres' => [
        [
            'id' => 1,
            'nom' => 'Jean Dupont',
            'role' => 'Adulte'
        ],
        [
            'id' => 2,
            'nom' => 'Marie Dupont',
            'role' => 'Adulte'
        ],
        [
            'id' => 3,
            'nom' => 'Lucas Dupont',
            'role' => 'Enfant'
        ]
    ]
];

echo json_encode($profile_data);