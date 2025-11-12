// ----- Views: Splash -> Quote -> Home -----
const viewSplash = document.getElementById('view-splash');
const viewQuote = document.getElementById('view-quote');
const viewHome = document.getElementById('view-home');
const viewCosts = document.getElementById('view-costs');

const goto = (el) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    el.classList.add('active');
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
});
inputEnd.addEventListener('change', () => {
    const date = new Date(inputEnd.value);
    chipEnd.textContent = `Au ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    updateDashboard(); // Appel de la fonction de mise à jour du KPI
});


// ----- Variables globales pour les graphiques, KPI et États de la Plage -----
const litersEl = document.getElementById('litersValue');
const costEl = document.getElementById('costValue'); 
let chart; // Graphique temps réel de la page Home
let dailyCostChart; // Graphique des coûts journaliers

// NOUVEAUX ÉTATS POUR LES SÉLECTEURS DE PLAGE
let homeRange = 'day'; // 'day' ou 'month'
let costsRange = 'week'; // 'week' ou 'month'

// ----- Utilitaires de Calcul de Dates -----
/**
 * Calcule les dates de début et de fin pour une plage donnée.
 * @param {'day'|'week'|'month'} range Le type de plage à calculer.
 * @returns {{start: string, end: string}} Les dates au format MySQL.
 */
function calculateDateRange(range) {
    const now = new Date();
    let startDate;
    const endDate = now.toISOString().split('T')[0]; // Date d'aujourd'hui (YYYY-MM-DD)

    if (range === 'day') {
        startDate = endDate; // Aujourd'hui
    } else if (range === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        startDate = sevenDaysAgo.toISOString().split('T')[0];
    } else if (range === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 29);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    return { 
        start: `${startDate} 00:00:00`,
        end: `${endDate} 23:59:59`
    };
}

// ----- Chargement des données historiques pour le graphique temps réel -----
async function fetchData(start, end) {
    const url = `../backend/get_data.php?start=${start}&end=${end}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) { 
            throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const json = await res.json();
        return json.map(d => ({
            x: new Date(d.date_mesure).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
            y: parseFloat(d.valeur)
        }));
    } catch (err) {
        console.error("Erreur de récupération des données graphiques (temps réel):", err);
        return [];
    }
}

// ----- Fonction de mise à jour du KPI/Résumé (utilise les sélecteurs de date en haut) -----
async function updateDashboard() {
    // S'assurer que les dates sont définies avant de faire les requêtes
    if (!inputStart.value || !inputEnd.value) {
        return; 
    }

    // On ajoute l'heure pour couvrir toute la journée pour les requêtes PHP
    const dateStart = inputStart.value + " 00:00:00";
    const dateEnd = inputEnd.value + " 23:59:59";

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
    
    // NOTE : Le graphique 'historyChart' est maintenant mis à jour par updateHomeChart()
}

// ----- NOUVELLE FONCTION : Mise à jour du Graphique de la page Home (Courbe temps réel) -----
async function updateHomeChart() {
    // Utilise le nouvel état homeRange pour déterminer la plage de temps
    const rangeType = homeRange === 'day' ? 'day' : 'month';
    const { start, end } = calculateDateRange(rangeType);

    try {
        const points = await fetchData(start, end);
        if (chart) {
            chart.data.labels = points.map(p => p.x);
            chart.data.datasets[0].data = points.map(p => p.y);
            chart.update();
        }
    } catch (err) {
        console.error("Erreur lors de la mise à jour du graphique de la page d'accueil :", err);
    }
}


// ----- Chart.js: Histogramme des coûts par jour (MIS À JOUR pour la plage) -----
async function drawDailyCostChart() {
    // Utilise le nouvel état costsRange pour déterminer la plage de temps
    const rangeType = costsRange === 'week' ? 'week' : 'month';
    const { start, end } = calculateDateRange(rangeType);
    
    try {
        const res = await fetch(`../backend/get_daily_costs.php?start=${start}&end=${end}`);
        if (!res.ok) {
            throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const data = await res.json();

        const labels = data.map(d => new Date(d.jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        const costs = data.map(d => d.cout_euros);

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
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { title: { display: false } },
                        y: { beginAtZero: true, title: { display: true, text: 'Coût en Euros (€)' } }
                    }
                }
            });
        } else {
            // MISE À JOUR
            dailyCostChart.data.labels = labels;
            dailyCostChart.data.datasets[0].data = costs;
            dailyCostChart.update('none'); 
        }

    } catch (err) {
        console.error("Erreur de chargement du graphique de coûts:", err);
    }
}

// ----- NOUVELLE FONCTION : Gestion des événements de plage -----
function setupRangeListeners() {
    // 1. Home Range Selector (Jour / Mois)
    document.getElementById('homeRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#homeRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            homeRange = e.target.getAttribute('data-range');
            updateHomeChart();
        }
    });

    // 2. Costs Range Selector (7 Jours / Mois)
    document.getElementById('costsRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#costsRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            costsRange = e.target.getAttribute('data-range');
            drawDailyCostChart();
        }
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

    // On s'assure que les chips affichent bien les dates initiales
    chipStart.textContent = `Du ${new Date(inputStart.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    chipEnd.textContent = `Au ${new Date(inputEnd.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    // --- Fin des dates par défaut ---

    // Initialisation du graphique principal (Courbe temps réel)
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#0b67ff', backgroundColor: 'rgba(11,103,255,.12)', fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: '#ff8c1a', pointHoverRadius: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { min: 0, grid: { color: 'rgba(15,23,42,.08)' } } }
        }
    });

    // 1. CHARGEMENT INITIAL DES KPI (basé sur les chips de date)
    await updateDashboard();
    
    // 2. CHARGEMENT INITIAL DES GRAPHIQUES (basé sur les états par défaut 'day' et 'week')
    await updateHomeChart();
    await drawDailyCostChart();
    
    // 3. MISE EN PLACE DES ÉCOUTEURS POUR LES BOUTONS JOUR/MOIS
    setupRangeListeners();

    // ----- SIMULATION D'INSERTION ET DE MISE À JOUR DU GRAPHIQUE -----
    setInterval(async () => {
        const newValue = (Math.random() * 2 + 1).toFixed(2); 

        await fetch('../backend/insert_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valeur: parseFloat(newValue) })
        });

        // Mise à jour de tous les éléments à chaque nouvelle donnée
        await updateDashboard();
        await updateHomeChart();
        await drawDailyCostChart();

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