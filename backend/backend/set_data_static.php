<?php
// c:\xampp\htdocs\brz\backend\set_data_static.php
// Ce fichier est inclus par seed_db.php et contient toutes les requêtes d'insertion statiques.

// Insertion de l'utilisateur principal par défaut
$pdo->exec("INSERT INTO utilisateur (prenom, nom, departement, is_main_user) VALUES ('Jean', 'Dupont', '35', 1);");

// Insertion des activités possibles
$pdo->exec("
INSERT INTO `activites` (`code_activite`, `label`, `mac_capteur`) VALUES
('douche_courte', 'Douche courte (-5min)', '00:1A:2B:3C:4D:01'),
('douche_longue', 'Douche longue (+5min)', '00:1A:2B:3C:4D:01'),
('bain', 'Bain', '00:1A:2B:3C:4D:01'),
('cycle_eco', 'Cycle Éco', '00:1A:2B:3C:4D:02'),
('cycle_normal', 'Cycle normal', '00:1A:2B:3C:4D:02'),
('cycle_intensif', 'Cycle intensif', '00:1A:2B:3C:4D:02'),
('vaisselle_main', 'Vaisselle (main)', '00:1A:2B:3C:4D:03'),
('nettoyage_legumes', 'Lavage des légumes', '00:1A:2B:3C:4D:03'),
('remplissage', 'Remplissage (carafe, etc.)', '00:1A:2B:3C:4D:03'),
('lavage_mains', 'Lavage des mains', '00:1A:2B:3C:4D:03'),
('arrosage_potager', 'Arrosage potager', '00:1A:2B:3C:4D:04'),
('arrosage_pelouse', 'Arrosage pelouse', '00:1A:2B:3C:4D:04'),
('nettoyage_exterieur', 'Nettoyage extérieur', '00:1A:2B:3C:4D:04');
");

// Insertion du contenu (infos et conseils)
$pdo->exec("
INSERT INTO `contenu_activite` (`id_activite`, `type_contenu`, `titre`, `contenu`) VALUES
((SELECT id FROM activites WHERE code_activite = 'vaisselle_main'), 'info', 'Quelques repères pour la vaisselle :', '<ul><li><strong>Moyenne constatée :</strong> ~42 Litres (vaisselle familiale).</li><li><strong>Méthode \"Gaspillage\" :</strong> Jusqu''à 100 Litres (robinet ouvert).</li><li><strong>Méthode \"Éco\" :</strong> 10 - 20 Litres (avec 2 bacs).</li></ul>'),
((SELECT id FROM activites WHERE code_activite = 'vaisselle_main'), 'conseil', '💡 Conseils pour atteindre votre objectif :', '<ul><li>Ne faites pas la vaisselle sous l''eau courante. Remplissez un bac pour laver et un autre pour rincer.<small style=\"display: block; color: #075985;\">(Source: C.I.Eau)</small></li><li style=\"margin-top: 8px;\">Équipez votre robinet d''un mousseur (aérateur). Il réduit le débit de 30 à 50% sans perte de confort.<small style=\"display: block; color: #075985;\">(Source: ADEME)</small></li></ul>'),
((SELECT id FROM activites WHERE code_activite = 'douche_courte'), 'info', 'Quelques repères pour la douche :', '<ul><li><strong>Débit standard :</strong> 15 à 20 Litres / minute.</li><li><strong>Douche de 5 min :</strong> ~85 Litres.</li><li><strong>Avec pommeau éco :</strong> ~40 Litres (50% d''économie).</li></ul>'),
((SELECT id FROM activites WHERE code_activite = 'douche_courte'), 'conseil', '💡 Conseils pour des douches plus économes :', '<ul><li>Installez un <strong>pommeau de douche économique</strong>. Il réduit le débit de moitié sans perte de confort. <small style=\"display: block; color: #075985;\">(Source: ADEME)</small></li><li style=\"margin-top: 8px;\">Utilisez un minuteur ou un sablier de douche pour maîtriser la durée. Viser <strong>moins de 5 minutes</strong> est un excellent objectif.</li></ul>'),
((SELECT id FROM activites WHERE code_activite = 'arrosage_potager'), 'info', 'Quelques repères pour l''arrosage :', '<ul><li><strong>Tuyau d''arrosage :</strong> ~18 Litres / minute.</li><li><strong>30 min d''arrosage :</strong> Plus de 500 Litres !</li><li><strong>Arrosoir de 10L :</strong> Permet un usage ciblé et maîtrisé.</li></ul>'),
((SELECT id FROM activites WHERE code_activite = 'arrosage_potager'), 'conseil', '💡 Conseils pour un arrosage efficace :', '<ul><li>Arrosez <strong>le soir ou tôt le matin</strong> pour limiter l''évaporation. <small style=\"display: block; color: #075985;\">(Source: C.I.Eau)</small></li><li style=\"margin-top: 8px;\">Installez un <strong>système de goutte-à-goutte</strong> et utilisez du <strong>paillage</strong> pour garder l''humidité au pied des plantes.</li></ul>');
");
