// ----- Views: Splash -> Quote -> Home -----
const viewSplash = document.getElementById('view-splash');
const viewQuote = document.getElementById('view-quote');
const viewHome = document.getElementById('view-home');
const viewCosts = document.getElementById('view-costs'); // Vue des coûts

const goto = (el) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    el.classList.add('active');

    // Gestion du style du menu latéral (pour l'onglet actif)
    const targetId = el.id;
    document.querySelectorAll('.side-link').forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(targetId)) {
            link.classList.add('active');
        }
    });
};

// Timeline d’entrée
setTimeout(() => goto(viewQuote), 1500);
setTimeout(() => goto(viewHome), 3000);

// ----- Menu latéral -----
const sideMenu = document.getElementById('side-menu');
const overlay = document.getElementById('overlay');
const btnClose = document.getElementById('btn-close-menu');

function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('show');
}
function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('show');
}
// Écouteur pour tous les boutons de menu (topbar et bottombar des deux vues)
document.querySelectorAll('#btn-menu, #btn-menu-costs, #openMenu, .open-menu-btn').forEach(btn => {
    btn.addEventListener('click', openMenu);
});
btnClose?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);

// ----- Sélection de dates (pour le KPI/Résumé) -----
const chipStart = document.getElementById('chip-start');
const chipEnd = document.getElementById('chip-end');
const inputStart = document.getElementById('dateStart');
const inputEnd = document.getElementById('dateEnd');

// Quand on clique sur le bouton, on déclenche le calendrier caché
chipStart.addEventListener('click', () => inputStart.showPicker && inputStart.showPicker());
chipEnd.addEventListener('click', () => inputEnd.showPicker && inputEnd.showPicker());

// Quand on choisit une date, on met à jour le texte du bouton ET on recharge les données
inputStart.addEventListener('change', () => {
    const date = new Date(inputStart.value);
    chipStart.textContent = `Du ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    updateDashboard(); // Appel de la fonction de mise à jour du KPI
    updateHomeChart(); 
});
inputEnd.addEventListener('change', () => {
    const date = new Date(inputEnd.value);
    chipEnd.textContent = `Au ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    updateDashboard(); // Appel de la fonction de mise à jour du KPI
    updateHomeChart(); 
});


// ----- Variables globales pour les graphiques, KPI et États de la Plage -----
const litersEl = document.getElementById('litersValue');
const costEl = document.getElementById('costValue'); 
let chart; // Graphique temps réel de la page Home
let dailyCostChart; // Graphique des coûts journaliers
let volumeBreakdownChart; // Camembert Volume (Accueil)
let usageCostChart;     // Camembert Coût (Coûts)

// NOUVEAUX ÉTATS POUR LES SÉLECTEURS DE PLAGE
let homeRange = 'day'; // 'day', 'month', ou 'year'
let costsRange = 'week'; // 'week', 'month', ou 'year'

// NOUVEAU : État pour le filtre par capteur
let selectedMac = 'ALL'; 
const simulatedMacs = ['00:1A:2B:3C:4D:01', '00:1A:2B:3C:4D:02', '00:1A:2B:3C:4D:03', '00:1A:2B:3C:4D:04'];

// NOUVEAU : Définition des couleurs et noms pour les camemberts
const macNames = {
    '00:1A:2B:3C:4D:01': 'Douche', 
    '00:1A:2B:3C:4D:02': 'Lave-linge', 
    '00:1A:2B:3C:4D:03': 'Évier Cuisine', 
    '00:1A:2B:3C:4D:04': 'Robinet Extérieur'
};
const macColors = {
    '00:1A:2B:3C:4D:01': '#0b67ff', // Bleu primaire
    '00:1A:2B:3C:4D:02': '#ff8c1a', // Orange
    '00:1A:2B:3C:4D:03': '#10bffd', // Cyan
    '00:1A:2B:3C:4D:04': '#4caf50', // Vert
};


// ----- Utilitaires de Calcul de Dates (Corrigé pour éviter le mélange des portées) -----
function calculateDateRange(range) {
    const now = new Date();
    let startDate;
    const endDate = now.toISOString().split('T')[0]; // Date d'aujourd'hui (YYYY-MM-DD)

    switch (range) {
        case 'day':
            startDate = endDate; // Aujourd'hui
            break;
        case 'week':
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);
            startDate = sevenDaysAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 29);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
            break;
        case 'year':
            // LOGIQUE CORRIGÉE
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            startDate = oneYearAgo.toISOString().split('T')[0];
            break;
        default:
            startDate = endDate; // Défaut
    }
    
    return { 
        start: `${startDate} 00:00:00`,
        end: `${endDate} 23:59:59`
    };
}

// ----- Chargement des données historiques pour le graphique temps réel -----
async function fetchData(start, end, grouping) { // 'grouping' est l'état homeRange
    let url;
    let macFilter = selectedMac !== 'ALL' ? `&mac=${selectedMac}` : ''; 
    let groupByType; // Définira le paramètre 'group_by_period' pour le PHP

    if (grouping === 'day') {
        // Mode Jour : on veut l'agrégation par HEURE
        groupByType = 'hour';
    } else if (grouping === 'week' || grouping === 'month') {
        // Mode Semaine/Mois : on veut l'agrégation par JOUR
        groupByType = 'day';
    } else if (grouping === 'year') {
        // Mode Année : on veut l'agrégation par MOIS
        groupByType = 'month';
    } else {
        groupByType = 'day';
    }

    // Le backend get_aggregated_data.php gère maintenant tous les groupements non-bruts
    url = `../backend/get_aggregated_data.php?start=${start}&end=${end}${macFilter}&group_by_period=${groupByType}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) { 
            throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const json = await res.json();
        
        return json.map(d => {
            let label;
            // Adapte l'étiquette en fonction de l'agrégation (pour l'affichage sur l'axe X)
            if (groupByType === 'month') { 
                 label = new Date(d.date_mesure).toLocaleDateString('fr-FR', { month:'short', year:'2-digit' });
            } else if (groupByType === 'day') {
                label = new Date(d.date_mesure).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
            } else { // Mode 'hour'
                label = new Date(d.date_mesure).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
            }
            return {
                x: label,
                y: parseFloat(d.valeur)
            };
        });
    } catch (err) {
        console.error("Erreur de récupération des données graphiques (temps réel):", err);
        return [];
    }
}

// ----- Fonction de mise à jour du KPI/Résumé (utilise les sélecteurs de date en haut) -----
async function updateDashboard() {
    if (!inputStart.value || !inputEnd.value) {
        return; 
    }

    const dateStart = inputStart.value + " 00:00:00";
    const dateEnd = inputStart.value + " 23:59:59"; // KPI journalier

    // 1. Mettre à jour le KPI de Litres et Coûts
    try {
        const summaryRes = await fetch(`../backend/get_summary.php?start=${dateStart}&end=${dateEnd}`); 
        if (!summaryRes.ok) {
            throw new Error(`Erreur HTTP résumé: ${summaryRes.status}`);
        }
        const summary = await summaryRes.json();
        
        litersEl.textContent = Math.round(summary.volume_total_litres || 0);
        
        if (costEl) { 
            costEl.textContent = `${summary.cout_total_euros.toFixed(2)} €`;
        }

    } catch (err) {
        console.error("Erreur lors de la récupération du résumé :", err);
        litersEl.textContent = "N/A";
        if (costEl) costEl.textContent = "N/A €";
    }
}

// ----- Mise à jour du Graphique de la page Home (Courbe temps réel) -----
async function updateHomeChart() {
    const rangeType = homeRange; 
    const { start, end } = calculateDateRange(rangeType);

    try {
        // NOUVEAU : Passer homeRange à fetchData pour l'agrégation
        const points = await fetchData(start, end, homeRange); 
        if (chart) {
            chart.data.labels = points.map(p => p.x);
            chart.data.datasets[0].data = points.map(p => p.y);
            // Affiche l'axe X si on n'est pas en mode "Jour" (temps réel)
            chart.options.scales.x.display = homeRange !== 'day'; 
            chart.update();
        }
    } catch (err) {
        console.error("Erreur lors de la mise à jour du graphique de la page d'accueil :", err);
    }
}


// ----- Chart.js: Histogramme des coûts par jour -----
async function drawDailyCostChart() {
    const rangeType = costsRange; 
    const { start, end } = calculateDateRange(rangeType);
    
    let macFilter = selectedMac !== 'ALL' ? `&mac=${selectedMac}` : ''; 
    
    // NOUVEAU : Déterminer le type de regroupement à passer au PHP
    const grouping = (costsRange === 'year') ? 'month' : 'day'; 

    try {
        // NOUVEAU : Ajouter le paramètre group_by_period
        const res = await fetch(`../backend/get_daily_costs.php?start=${start}&end=${end}${macFilter}&group_by_period=${grouping}`); 
        
        if (!res.ok) {
            throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const data = await res.json();

        const labels = data.map(d => new Date(d.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
        const costs = data.map(d => d.cout_euros);

        // Récupération du nom affiché du capteur pour le titre
        let chartTitle = "Coût par Jour (€)";
        const sensorSelectCost = document.getElementById('sensor-select-costs');

        if (selectedMac !== 'ALL' && sensorSelectCost && sensorSelectCost.selectedIndex !== -1) {
            const selectedOption = sensorSelectCost.options[sensorSelectCost.selectedIndex];
            chartTitle += ` - ${selectedOption.textContent}`;
        } else if (selectedMac === 'ALL') {
            chartTitle += ` - Total`;
        }


        if (!dailyCostChart) {
            // CRÉATION INITIALE
            const ctx = document.getElementById('dailyCostChart').getContext('2d');
            dailyCostChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Coût (€)',
                        data: costs,
                        backgroundColor: 'rgba(11, 103, 255, 0.7)',
                        borderColor: 'rgba(11, 103, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, 
                    plugins: { 
                        legend: { display: false },
                        title: { 
                            display: true,
                            text: chartTitle 
                        }
                    },
                    scales: {
                        x: { title: { display: false } },
                        y: { beginAtZero: true, title: { display: true, text: 'Coût en Euros (€)' } }
                    }
                }
            });
        } else {
            // MISE À JOUR
            dailyCostChart.options.plugins.title.text = chartTitle; // METTRE À JOUR LE TITRE
            dailyCostChart.data.labels = labels;
            dailyCostChart.data.datasets[0].data = costs;
            dailyCostChart.update('none'); 
        }

    } catch (err) {
        console.error("Erreur de chargement du graphique de coûts:", err);
    }
}

// ----- NOUVELLE FONCTION : Dessin des camemberts de répartition -----
async function drawBreakdownCharts() {
    // La répartition utilise la plage de temps de la vue "Coûts"
    const { start, end } = calculateDateRange(costsRange); 

    try {
        // 1. Récupération des données agrégées
        const res = await fetch(`../backend/get_breakdown.php?start=${start}&end=${end}`);
        if (!res.ok) { throw new Error(`Erreur HTTP: ${res.status}`); }
        const data = await res.json();

        // Si aucune donnée n'est renvoyée (DB vide), on arrête
        if (!data || data.length === 0) return; 

        // Préparation des données pour Chart.js
        const labels = data.map(d => macNames[d.mac] || d.mac);
        const backgroundColors = data.map(d => macColors[d.mac] || '#cccccc');
        
        // Calcul des totaux
        const volumes = data.map(d => d.volume_litres);
        const costs = data.map(d => d.cout_euros);
        const totalVolume = volumes.reduce((sum, val) => sum + val, 0);
        const totalCost = costs.reduce((sum, val) => sum + val, 0);


        // --- Configuration du Camembert VOLUME (%) (Accueil) ---
        if (!volumeBreakdownChart) {
            const ctx = document.getElementById('volumeBreakdownChart').getContext('2d');
            volumeBreakdownChart = new Chart(ctx, {
                type: 'doughnut', 
                data: {
                    labels: labels,
                    datasets: [{
                        data: volumes,
                        backgroundColor: backgroundColors,
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: true, text: `Volume total : ${Math.round(totalVolume)} L` },
                        datalabels: { // Affiche le pourcentage sur la part
                            formatter: (value, context) => {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return percentage + '%';
                            },
                            color: '#fff',
                            font: { weight: 'bold' }
                        },
                        tooltip: { // Détail des Litres au survol
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += `${Math.round(context.raw)} Litres (${(context.raw/totalVolume*100).toFixed(1)}%)`;
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            volumeBreakdownChart.data.labels = labels;
            volumeBreakdownChart.data.datasets[0].data = volumes;
            volumeBreakdownChart.options.plugins.title.text = `Volume total : ${Math.round(totalVolume)} L`;
            volumeBreakdownChart.update('none');
        }


        // --- Configuration du Camembert COÛT (€) (Coûts) ---
        if (!usageCostChart) {
            const ctx = document.getElementById('usageChart').getContext('2d');
            usageCostChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: costs,
                        backgroundColor: backgroundColors,
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: true, text: `Coût total : ${totalCost.toFixed(2)} €` },
                        datalabels: { // Affiche la valeur en euros directement sur la part
                            formatter: (value, context) => {
                                return value.toFixed(2) + ' €';
                            },
                            color: '#fff',
                            font: { weight: 'bold' }
                        },
                        tooltip: { // Détail en Euros au survol
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += `${context.raw.toFixed(2)} €`;
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            usageCostChart.data.labels = labels;
            usageCostChart.data.datasets[0].data = costs;
            usageCostChart.options.plugins.title.text = `Coût total : ${totalCost.toFixed(2)} €`;
            usageCostChart.update('none');
        }

    } catch (err) {
        console.error("Erreur de chargement des camemberts de répartition:", err);
    }
}


// ----- Gestion des événements de plage et du sélecteur de capteur -----
function setupRangeListeners() {
    // 1. Home Range Selector (Jour / Mois / Année)
    document.getElementById('homeRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#homeRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            homeRange = e.target.getAttribute('data-range');
            updateHomeChart();
            drawBreakdownCharts(); // MAJ du Camembert Volume sur l'Accueil
        }
    });

    // 2. Costs Range Selector (Semaine / Mois / Année)
    document.getElementById('costsRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#costsRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            costsRange = e.target.getAttribute('data-range');
            drawDailyCostChart();
            drawBreakdownCharts(); // MAJ du Camembert Coût et Volume
        }
    });
    
    // 3. Sélecteur de Capteur (Synchronisation)
    document.querySelectorAll('.sensor-select-all').forEach(selectElement => {
        selectElement.addEventListener('change', (e) => {
            const newMac = e.target.value;
            selectedMac = newMac;
            
            // Synchroniser les deux sélecteurs pour maintenir la cohérence
            document.querySelectorAll('.sensor-select-all').forEach(otherSelect => {
                if (otherSelect !== e.target) {
                    otherSelect.value = newMac;
                }
            });

            // Mise à jour des graphiques
            updateHomeChart();
            drawDailyCostChart();
        });
    });
}


// ----- Bloc d'initialisation principal -----
(async () => {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    // --- Définir les dates par défaut (pour les chips KPI) ---
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    
    inputStart.value = `${y}-${m}-${d}`;
    inputEnd.value = `${y}-${m}-${d}`;

    chipStart.textContent = `Du ${new Date(inputStart.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    chipEnd.textContent = `Au ${new Date(inputEnd.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    // --- Fin des dates par défaut ---

    // Initialisation du graphique principal
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#0b67ff', backgroundColor: 'rgba(11,103,255,.12)', fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: '#ff8c1a', pointHoverRadius: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false }, 
                y: { min: 0, grid: { color: 'rgba(15,23,42,.08)' } }
            }
        }
    });

    // 1. CHARGEMENT INITIAL DES KPI (basé sur les chips de date)
    await updateDashboard();
    
    // 2. CHARGEMENT INITIAL DES GRAPHIQUES (basé sur les états par défaut 'day' et 'week' et 'ALL' mac)
    await updateHomeChart();
    await drawDailyCostChart();
    await drawBreakdownCharts(); // LANCEMENT DES CAMEMBERTS
    
    // 3. MISE EN PLACE DES ÉCOUTEURS POUR LES BOUTONS JOUR/MOIS/CAPTEUR
    setupRangeListeners();

    // ----- SIMULATION D'INSERTION ET DE MISE À JOUR DU GRAPHIQUE -----
    let counter = 0;
    const updateInterval = 60000; 

    setInterval(async () => {
        const activeMac = simulatedMacs[Math.floor(Math.random() * simulatedMacs.length)];
        const newValue = (Math.random() * 2 + 1).toFixed(2); 

        await fetch('../backend/insert_data.php', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valeur: parseFloat(newValue), adresse_mac_capteur: activeMac })
        });

        await updateDashboard();
        await updateHomeChart();

        if (counter % (updateInterval / 2000) === 0) {
            await drawDailyCostChart(); 
            await drawBreakdownCharts(); // Mise à jour lente des camemberts
        }

        counter++;

    }, 2000); 

})();


// ----- PWA (service worker) -----
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(console.warn);
    });
}
*/