// ==========================================
// 1. NAVIGATION ET INTERFACE
// ==========================================
const API_BASE_URL = '/brz/backend/'; // Chemin ABSOLU depuis la racine du serveur

const viewSplash = document.getElementById('view-splash');
const viewQuote = document.getElementById('view-quote');
const viewHome = document.getElementById('view-home');
const viewCosts = document.getElementById('view-costs'); 
const viewProfile = document.getElementById('view-profile');
const viewSettings = document.getElementById('view-settings'); // NOUVEAU
const viewAlerts = document.getElementById('view-alerts');

// Fonction de navigation avec RE-ANIMATION FORCÉE
const goto = (el) => {
    // 1. Changer la vue visible
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    el.classList.add('active');

    // 2. Mise à jour du menu actif
    const targetId = el.id;
    document.querySelectorAll('.side-link').forEach(link => {
        link.classList.remove('active');
        // Vérifie si le lien pointe vers la vue actuelle
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(targetId)) {
            link.classList.add('active');
        }
    });
    closeMenu();

    // 3. GESTION DES ANIMATIONS (Destroy & Re-create)
    // On attend 50ms que le DOM (display: block) soit prêt
    setTimeout(() => {
        if (targetId === 'view-home') {
            // A. Courbe (Line) : On reset simplement l'anim (plus doux pour une courbe)
            if (chart) { 
                chart.reset(); 
                chart.update(); 
            }
            
            // B. Camembert Volume : ON DÉTRUIT POUR RECRÉER (Animation complète)
            if (volumeBreakdownChart) {
                volumeBreakdownChart.destroy();
                volumeBreakdownChart = undefined; // Important : vider la variable
            }
            drawVolumePie(); // On redessine de zéro
        } 
        else if (targetId === 'view-costs') {
            // C. Histogramme (Bar) : ON DÉTRUIT POUR RECRÉER
            if (dailyCostChart) {
                dailyCostChart.destroy();
                dailyCostChart = undefined;
            }
            drawDailyCostChart();

            // D. Camembert Coût : ON DÉTRUIT POUR RECRÉER
            if (usageCostChart) {
                usageCostChart.destroy();
                usageCostChart = undefined;
            }
            drawCostPie();
        }
    }, 50);

    // 4. GESTION SPÉCIFIQUE À LA VUE
    // Si on va sur la vue des recommandations, on lance l'analyse
    if (targetId === 'view-alerts') {
        const recoPicker = document.getElementById('alerts-date-picker');
        if (recoPicker && !recoPicker.dataset.initialized) {
            recoPicker.value = toLocalISOString(recoViewDate);
            recoPicker.addEventListener('change', (e) => {
                recoViewDate = new Date(e.target.value);
                // L'analyse est déclenchée par le bouton 🔄, pas automatiquement au changement de date.
            });
            recoPicker.dataset.initialized = 'true';
        }
        // On ne génère plus automatiquement, on attend le clic sur 🔄
    }
};

setTimeout(() => goto(viewQuote), 1500);
setTimeout(() => goto(viewHome), 3000);

const sideMenu = document.getElementById('side-menu');
const overlay = document.getElementById('overlay');
const btnClose = document.getElementById('btn-close-menu');

function openMenu() { sideMenu.classList.add('open'); overlay.classList.add('show'); }
function closeMenu() { sideMenu.classList.remove('open'); overlay.classList.remove('show'); }

document.querySelectorAll('#btn-menu, #btn-menu-costs, #openMenu, .open-menu-btn').forEach(btn => {
    btn.addEventListener('click', openMenu);
});

btnClose?.addEventListener('click', closeMenu);

// --- FONCTION UTILITAIRE D'AFFICHAGE (Notification) ---
function showNotification(message, isError = false) {
    const toast = document.getElementById('toast-message') || document.createElement('div');
    if (!document.getElementById('toast-message')) {
        toast.id = 'toast-message';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#f44336' : '#4caf50';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}



// ==========================================
// MODALE D'ACTIVITÉ (AJOUT)
// ==========================================

const activityModal = document.getElementById('activity-modal');
const closeModalBtn = document.getElementById('close-activity-modal');
const modalDateEl = document.getElementById('modal-date');
const modalTimeEl = document.getElementById('modal-time');
const modalLitersEl = document.getElementById('modal-liters');
const activityForm = document.getElementById('activity-form');
const activitySelect = document.getElementById('activity-select');
const dishwashingInfoContainer = document.getElementById('dishwashing-info-container');
const goalInput = document.getElementById('goal-input-liters');
const goalInputGroup = document.getElementById('goal-input-group'); // Vaisselle
const dishwashingTipsContainer = document.getElementById('dishwashing-tips-container');

// NOUVEAU: Récupération des éléments pour la douche et l'arrosage
const showerInfoContainer = document.getElementById('shower-info-container');
const showerGoalInput = document.getElementById('shower-goal-input');
const showerTipsContainer = document.getElementById('shower-tips-container');
const wateringInfoContainer = document.getElementById('watering-info-container');
const wateringGoalInput = document.getElementById('watering-goal-input');
const wateringTipsContainer = document.getElementById('watering-tips-container');
// NOUVEAU: Stockage simple des objectifs
let userObjectives = []; 

// NOUVEAU: Variables pour stocker les données chargées depuis la BDD
let activityData = {
    activities: {},
    content: {}
};

// Fonction pour ouvrir la modale
function openActivityModal(date, time, liters, macAddress) {
    // 1. Mettre à jour les informations de la modale
    modalDateEl.textContent = date;
    modalTimeEl.textContent = time;
    modalLitersEl.textContent = liters;

    // 2. Mettre à jour dynamiquement les options du <select> depuis les données chargées
    const activities = activityData.activities[macAddress] || [];
    activitySelect.innerHTML = '<option value="">-- Choisir une activité --</option>'; // Vider et ajouter l'option par défaut
    activities.forEach(act => activitySelect.innerHTML += `<option value="${act.value}">${act.label}</option>`);

    // 3. Afficher la modale
    activityModal.classList.add('show');
    overlay.classList.add('show');
}

// Fonction pour fermer la modale
function closeActivityModal() {
    activityModal.classList.remove('show');
    overlay.classList.remove('show');
    // Cacher toutes les sections spécifiques
    document.querySelectorAll('.activity-specific-info').forEach(el => el.classList.remove('show'));
    // Cacher toutes les sections de conseils
    document.querySelectorAll('.goal-tips').forEach(el => el.classList.remove('show'));
    // Ré-afficher tous les champs de saisie d'objectif
    document.querySelectorAll('.input-with-button').forEach(el => el.parentElement.style.display = 'block');
    activityForm.reset(); // Réinitialise le formulaire
}

// Fonction pour sauvegarder l'activité
function saveActivity() {
    const activity = activitySelect.value;
    if (!activity) {
        showNotification("Veuillez sélectionner une activité.", true);
        return;
    }

    const savedData = { 
        date: modalDateEl.textContent, 
        time: modalTimeEl.textContent, 
        liters: modalLitersEl.textContent, 
        activity: activity 
    };

    // Logique pour sauvegarder l'objectif
    let goalValue = 0;
    let goalName = '';
    let tipsContainer = null;
    let goalInputGroupToHide = null;

    if (activity === 'vaisselle_main' && goalInput.value) {
        goalValue = parseFloat(goalInput.value);
        goalName = 'Prochaine Vaisselle';
        tipsContainer = dishwashingTipsContainer;
        goalInputGroupToHide = goalInput.closest('.form-group');

    } else if ((activity === 'douche_courte' || activity === 'douche_longue') && showerGoalInput.value) {
        goalValue = parseFloat(showerGoalInput.value); // La valeur est maintenant en Litres
        goalName = `Prochaine Douche`;
        tipsContainer = showerTipsContainer;
        goalInputGroupToHide = showerGoalInput.closest('.form-group');

    } else if (activity.startsWith('arrosage_') && wateringGoalInput.value) {
        goalValue = parseFloat(wateringGoalInput.value);
        goalName = 'Prochain Arrosage';
        tipsContainer = wateringTipsContainer;
        goalInputGroupToHide = wateringGoalInput.closest('.form-group');
    }

    // Si un objectif a été défini, on l'enregistre et on affiche les conseils
    if (goalValue > 0 && tipsContainer) {
        const objectiveData = {
            name: goalName,
            target: goalValue,
            unit: 'L' // Tous les objectifs sont maintenant en Litres
        };

        // On envoie l'objectif au serveur
        fetch(`${API_BASE_URL}add_objective.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objectiveData)
        })
        .then(res => {
            // On tente de lire la réponse JSON dans tous les cas
            return res.json().then(data => {
                // On vérifie si la réponse était OK *après* avoir lu le JSON
                if (!res.ok) {
                    // Si le serveur a renvoyé une erreur, on la propage avec les détails du JSON
                    throw new Error(data.error || `Le serveur a répondu avec une erreur: ${res.status}`);
                }
                return data; // Si tout va bien, on renvoie les données
            });
        })
        .then(result => {
            if (result.success) {
                // Si l'ajout a réussi, on recharge simplement la liste depuis la BDD pour être sûr
                loadObjectives();
            }
        })
        .catch(err => console.error("Erreur lors de l'ajout de l'objectif:", err));
        
        // Afficher les conseils et cacher le champ de saisie
        tipsContainer.classList.add('show');
        if (goalInputGroupToHide) {
            goalInputGroupToHide.style.display = 'none';
        }
        
        const notificationMessage = `Objectif "${goalName}" fixé à ${goalValue} L !`;
        showNotification(notificationMessage);

        // On ne ferme PAS la modale pour laisser l'utilisateur lire les conseils.
        return;
    }

    // Si aucun objectif n'est défini (ou pour les autres activités), on ferme simplement la modale.
    console.log("Activité enregistrée :", savedData);
    // Ici, vous enverrez les données au serveur plus tard.
    
    // Si ce n'est pas une vaisselle avec objectif, on enregistre et on ferme.
    const activityLabel = activitySelect.options[activitySelect.selectedIndex].text;
    showNotification(`Activité "${activityLabel}" enregistrée !`);
    closeActivityModal();
}

// NOUVEAU: Fonction pour afficher les objectifs dans l'onglet "Alertes"
function renderObjectives() {
    const listEl = document.getElementById('objectives-list');
    const cardEl = document.getElementById('objectives-container-card');
    if (!listEl || !cardEl) return;

    // On affiche la carte si elle n'est pas déjà visible et qu'il y a des objectifs
    if (userObjectives.length > 0) {
        cardEl.style.display = 'block';
    } else {
        cardEl.style.display = 'none';
        return;
    }

    listEl.innerHTML = userObjectives.map(obj => `
        <li><span class="objective-name">${obj.nom_objectif}</span> <span class="objective-value">${obj.valeur_cible} ${obj.unite}</span></li>
    `).join('');
}

// NOUVEAU: Fonction pour charger les objectifs depuis la BDD
async function loadObjectives() {
    try {
        const response = await fetch(`${API_BASE_URL}get_objectives.php`);
        const data = await response.json();
        userObjectives = data; // On remplace le tableau local par les données du serveur
        renderObjectives();
    } catch (error) {
        console.error("Impossible de charger les objectifs:", error);
    }
}

// ==========================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// ==========================================

// Écouteur pour afficher/cacher les options de vaisselle
activitySelect.addEventListener('change', () => {
    const selectedActivity = activitySelect.value;

    // Cacher toutes les sections pour repartir de zéro
    document.querySelectorAll('.activity-specific-info').forEach(el => el.classList.remove('show'));

    // Afficher la section correspondante
    if (selectedActivity === 'vaisselle_main') {
        dishwashingInfoContainer.classList.add('show');
    } else if (selectedActivity === 'douche_courte' || selectedActivity === 'douche_longue') {
        showerInfoContainer.classList.add('show');
    } else if (selectedActivity.startsWith('arrosage_')) {
        wateringInfoContainer.classList.add('show');
    }
    // Pour les autres cas (lave-linge, etc.), rien ne s'affiche, ce qui est le comportement souhaité.
});

// NOUVEAU: Fonction pour charger les données des activités depuis le serveur
async function loadActivityData() {
    try {
        const response = await fetch(`${API_BASE_URL}get_activity_data.php`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        activityData = await response.json();
        console.log("Données d'activités chargées avec succès depuis la BDD !");
    } catch (error) {
        console.error("Impossible de charger les données d'activités:", error);
        // Utiliser la fonction de notification existante
        showNotification("Erreur de chargement des données d'activités.", true);
    }
}

// ==========================================
// 2. GESTION DES DATES (KPI ACCUEIL)
// ==========================================

const chipStart = document.getElementById('chip-start');
const chipEnd = document.getElementById('chip-end');
const inputStart = document.getElementById('dateStart');
const inputEnd = document.getElementById('dateEnd');

chipStart.addEventListener('click', () => inputStart.showPicker && inputStart.showPicker());
chipEnd.addEventListener('click', () => inputEnd.showPicker && inputEnd.showPicker());

inputStart.addEventListener('change', () => {
    const date = new Date(inputStart.value);
    chipStart.textContent = `Du ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    updateDashboard(); updateHomeChart(); 
});
inputEnd.addEventListener('change', () => {
    const date = new Date(inputEnd.value);
    chipEnd.textContent = `Au ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    updateDashboard(); updateHomeChart(); 
});

// Écouteurs pour la modale d'activité et l'overlay
closeModalBtn?.addEventListener('click', closeActivityModal);

// L'overlay ferme maintenant à la fois le menu et la modale
overlay?.addEventListener('click', () => {
    closeMenu();
    closeActivityModal();
});

// ==========================================
// 3. VARIABLES GLOBALES
// ==========================================

const litersEl = document.getElementById('litersValue');
const costEl = document.getElementById('costValue'); 
let chart;              // Courbe (Accueil)
let dailyCostChart;     // Histogramme (Coûts)
let volumeBreakdownChart; // Camembert (Accueil)
let usageCostChart;     // Camembert (Coûts)

let homeRange = 'day'; 
let costsRange = 'month'; 
let selectedMac = 'ALL'; 
let homeViewDate = new Date(); // NOUVEAU: Date curseur pour le graphique d'accueil
let sensorConfig = {}; // NOUVEAU: Remplacera macNames et macColors

// Date curseur pour la navigation historique (Onglet Coûts)
let currentViewDate = new Date(); 
let recoViewDate = new Date(); // NOUVEAU: Date curseur pour les recommandations

const simulatedMacs = ['00:1A:2B:3C:4D:01', '00:1A:2B:3C:4D:02', '00:1A:2B:3C:4D:03', '00:1A:2B:3C:4D:04']; // Conservé pour la simulation de données si utilisée
// const macNames = { '00:1A:2B:3C:4D:01': 'Douche', '00:1A:2B:3C:4D:02': 'Lave-linge', '00:1A:2B:3C:4D:03': 'Cuisine', '00:1A:2B:3C:4D:04': 'Robinet Ext.' };
// const macColors = { '00:1A:2B:3C:4D:01': '#0b67ff', '00:1A:2B:3C:4D:02': '#ff8c1a', '00:1A:2B:3C:4D:03': '#10bffd', '00:1A:2B:3C:4D:04': '#4caf50' };


// ==========================================
// 4. FONCTIONS UTILITAIRES
// ==========================================

function toLocalISOString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function calculateDateRange(range, referenceDate = new Date()) {
    const ref = new Date(referenceDate); 
    let startDate, endDate;

    switch (range) {
        case 'day':
            startDate = toLocalISOString(ref);
            endDate = startDate;
            break;
        case 'week':
            const dayOfWeek = ref.getDay(); 
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
            const monday = new Date(ref);
            monday.setDate(ref.getDate() + diffToMonday);
            startDate = toLocalISOString(monday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            endDate = toLocalISOString(sunday);
            break;
        case 'month':
            const firstDayOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
            const lastDayOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
            startDate = toLocalISOString(firstDayOfMonth);
            endDate = toLocalISOString(lastDayOfMonth);
            break;
        case 'year':
            const firstDayOfYear = new Date(ref.getFullYear(), 0, 1);
            const lastDayOfYear = new Date(ref.getFullYear(), 11, 31);
            startDate = toLocalISOString(firstDayOfYear);
            endDate = toLocalISOString(lastDayOfYear);
            break;
        default:
            startDate = toLocalISOString(ref);
            endDate = startDate;
    }
    return { start: `${startDate} 00:00:00`, end: `${endDate} 23:59:59`, labelObj: { start: startDate, end: endDate } };
}


// ==========================================
// 5. LOGIQUE DES GRAPHIQUES
// ==========================================

async function fetchData(start, end, grouping) { 
    let url;
    let macFilter = selectedMac !== 'ALL' ? `&mac=${selectedMac}` : ''; 
    let groupByType; 
    if (grouping === 'day') groupByType = 'hour';
    else if (grouping === 'week' || grouping === 'month') groupByType = 'day';
    else if (grouping === 'year') groupByType = 'month';
    else groupByType = 'day';

    url = `${API_BASE_URL}get_aggregated_data.php?start=${start}&end=${end}${macFilter}&group_by_period=${groupByType}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        const json = await res.json();
        
        return json.map(d => {
            let label;
            if (groupByType === 'month') {
                // Si la vue est 'year', on affiche juste le mois. Sinon (vue 'month'), on affiche jour+mois.
                const options = (grouping === 'year') ? { month:'short' } : { day:'numeric', month:'short' };
                label = new Date(d.date_mesure).toLocaleDateString('fr-FR', options);
            }
            else if (groupByType === 'day') label = new Date(d.date_mesure).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
            else label = new Date(d.date_mesure).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
            return { x: label, y: parseFloat(d.valeur) };
        });
    } catch (err) {
        console.error("Erreur fetch:", err);
        return [];
    }
}

async function updateDashboard() {
    if (!inputStart.value || !inputEnd.value) return; 
    const dateStart = inputStart.value + " 00:00:00";
    const dateEnd = inputEnd.value + " 23:59:59";
    try {
        const res = await fetch(`${API_BASE_URL}get_summary.php?start=${dateStart}&end=${dateEnd}`); 
        if (!res.ok) throw new Error(`Erreur KPI`);
        const summary = await res.json();
        litersEl.textContent = Math.round(summary.volume_total_litres || 0);
        if (costEl) costEl.textContent = `${summary.cout_total_euros.toFixed(2)} €`;
    } catch (err) { console.error("Erreur KPI", err); }
}

async function updateHomeChart() {
    const { start, end } = calculateDateRange(homeRange, homeViewDate); // Utilise homeViewDate au lieu de new Date()
    try {
        const points = await fetchData(start, end, homeRange);
        if (chart) {
            const isDayView = (homeRange === 'day');
            const newChartType = isDayView ? 'bar' : 'line';

            // Si le type de graphique change, il est plus sûr de le détruire et de le recréer.
            if (!chart || chart.config.type !== newChartType) {
                chart.destroy();
                chart = undefined; // Vider la variable
                const ctx = document.getElementById('historyChart').getContext('2d');
                chart = new Chart(ctx, {
                    type: newChartType,
                    data: { labels: [], datasets: [{ data: [] }] },
                    options: getHomeChartOptions() // Utiliser une fonction pour les options
                });
            }

            if (isDayView) {
                // Pour la vue jour, on s'assure que toutes les heures de 0 à 23h sont présentes
                const hourlyData = new Array(24).fill(0);
                points.forEach(p => {
                    const hour = parseInt(p.x.split(':')[0]); // Extrait l'heure de "HH:mm"
                    if (!isNaN(hour)) hourlyData[hour] += p.y;
                });
                chart.data.labels = hourlyData.map((_, i) => `${i}h`);
                chart.data.datasets[0].data = hourlyData;
            } else {
                chart.data.labels = points.map(p => p.x);
                chart.data.datasets[0].data = points.map(p => p.y);
            }
            
            // Appliquer les styles spécifiques au type de graphique
            applyChartStyles(chart, isDayView);

            chart.update();
        }
    } catch (err) { console.error("Erreur Home Chart"); }
}


// --- Graphique Coûts (AVEC ANIMATION REINITIALISÉE) ---
async function drawDailyCostChart() {
    const { start, end } = calculateDateRange(costsRange, currentViewDate);
    let macFilter = selectedMac !== 'ALL' ? `&mac=${selectedMac}` : ''; 
    const grouping = (costsRange === 'year') ? 'month' : 'day'; 

    try {
        const res = await fetch(`${API_BASE_URL}get_daily_costs.php?start=${start}&end=${end}${macFilter}&group_by_period=${grouping}`); 
        if (!res.ok) throw new Error(`Erreur Coûts`);
        const data = await res.json();

        let labelOptions;
        if (costsRange === 'year') labelOptions = { month: 'short' }; 
        else labelOptions = { weekday: 'short', day: 'numeric' };
        
        const labels = data.map(d => new Date(d.jour).toLocaleDateString('fr-FR', labelOptions));
        const costs = data.map(d => d.cout_euros);

        let chartTitle = "Coût de ma Consommation (€)"; 
        const sensorSelectCost = document.getElementById('sensor-select-costs');
        if (selectedMac !== 'ALL' && sensorSelectCost && sensorSelectCost.selectedIndex !== -1) {
            chartTitle += ` - ${sensorSelectCost.options[sensorSelectCost.selectedIndex].textContent}`;
        }

        if (!dailyCostChart) {
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
                    animation: { duration: 800, easing: 'easeOutQuart' },
                    plugins: { legend: { display: false }, title: { display: true, text: chartTitle } },
                    scales: {
                        x: { title: { display: false }, display: true },
                        y: { beginAtZero: true, title: { display: true, text: 'Coût (€)' } }
                    }
                }
            });
        } else {
            dailyCostChart.options.plugins.title.text = chartTitle;
            dailyCostChart.data.labels = labels;
            dailyCostChart.data.datasets[0].data = costs;
            // MISE À JOUR AVEC ANIMATION
            dailyCostChart.update(); 
        }
    } catch (err) { console.error("Erreur Cost Chart", err); }
}

// --- Camemberts (AVEC ANIMATION REINITIALISÉE) ---
async function drawVolumePie() {
    const { start, end } = calculateDateRange(homeRange, new Date()); 
    await drawPie('volumeBreakdownChart', start, end, true);
}

async function drawCostPie() {
    const { start, end } = calculateDateRange(costsRange, currentViewDate); 
    await drawPie('usageChart', start, end, false);
}

async function drawPie(canvasId, start, end, isVolume) {
    try {
        const res = await fetch(`${API_BASE_URL}get_breakdown.php?start=${start}&end=${end}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || data.length === 0) return; 

        const labels = data.map(d => (sensorConfig[d.mac] && sensorConfig[d.mac].name) || d.mac);
        const backgroundColors = data.map(d => (sensorConfig[d.mac] && sensorConfig[d.mac].color) || '#cccccc');
        const values = data.map(d => isVolume ? parseFloat(d.volume_litres) : parseFloat(d.cout_euros));
        const total = values.reduce((a, b) => a + b, 0);
        const unit = isVolume ? 'L' : '€';
        const titleText = isVolume ? `Total : ${Math.round(total)} ${unit}` : `Total : ${total.toFixed(2)} ${unit}`;

        let chartInstance = Chart.getChart(canvasId);

        if (!chartInstance) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: backgroundColors, borderWidth: 1 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    // ANIMATION FLUIDE
                    animation: { animateScale: true, animateRotate: true, duration: 800, easing: 'easeOutQuart' },
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: true, text: titleText },
                        datalabels: { 
                            formatter: (val, ctx) => {
                                const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                return (val / sum * 100).toFixed(1) + '%';
                            },
                            color: '#fff', font: { weight: 'bold' }
                        },
                        tooltip: { 
                            callbacks: {
                                label: function(context) {
                                    const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const pct = (sum > 0) ? (context.raw / sum * 100).toFixed(1) : 0;
                                    return `${isVolume ? Math.round(context.raw) : context.raw.toFixed(2)} ${unit} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            chartInstance.data.labels = labels;
            chartInstance.data.datasets[0].data = values;
            chartInstance.options.plugins.title.text = titleText;
            // ANIMATION LORS DE LA MISE À JOUR (plus de 'none')
            chartInstance.update(); 
        }
    } catch (e) { console.error("Erreur Pie", e); }
}


// ==========================================
// 6. LISTENERS & INITIALISATION
// ==========================================

function setupRangeListeners() {

    // 1. Accueil
    document.getElementById('homeRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#homeRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            homeRange = e.target.getAttribute('data-range');

            // NOUVEAU: Adapter le type de l'input de date
            if (homeRange === 'month') {
                homeDatePicker.type = 'month';
            } else if (homeRange === 'year') {
                homeDatePicker.type = 'number';
            } else { // 'day'
                homeDatePicker.type = 'date';
            }

            // Affiche ou cache le sélecteur de date en fonction de la vue
            if (homeRange === 'week') {
                homeDateSelector.style.display = 'none';
            } else {
                homeDateSelector.style.display = 'flex';
            }

            // Réinitialise la date à "aujourd'hui" si on quitte la vue 'jour' et y revient
            if (homeRange === 'week') {
                homeViewDate = new Date();
            }

            updateHomePeriodDisplay(); // Mettre à jour l'affichage de la période
            updateHomeChart();
            drawVolumePie(); 
        }
    });

    // 2. Coûts
    document.getElementById('costsRangeSelector').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#costsRangeSelector button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            costsRange = e.target.getAttribute('data-range');
            
            updateCostsPeriodDisplay();
            drawDailyCostChart();
            drawCostPie(); 
        }
    });
    
    // 3. Date Picker Coûts (NOUVELLE LOGIQUE)
    const costsDatePicker = document.getElementById('costsDatePicker');
    const prevPeriodCostsBtn = document.getElementById('prevPeriodCostsBtn');
    const nextPeriodCostsBtn = document.getElementById('nextPeriodCostsBtn');

    if (costsDatePicker) {
        updateCostsPeriodDisplay(); // Affichage initial

        // Le picker de date n'est pas modifiable directement, on utilise les flèches
        costsDatePicker.readOnly = true; 

        prevPeriodCostsBtn.addEventListener('click', () => {
            if (costsRange === 'week') currentViewDate.setDate(currentViewDate.getDate() - 7);
            else if (costsRange === 'month') currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            else if (costsRange === 'year') currentViewDate.setFullYear(currentViewDate.getFullYear() - 1);
            
            updateCostsPeriodDisplay();
            drawDailyCostChart();
            drawCostPie();
        });

        nextPeriodCostsBtn.addEventListener('click', () => {
            if (costsRange === 'week') currentViewDate.setDate(currentViewDate.getDate() + 7);
            else if (costsRange === 'month') currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            else if (costsRange === 'year') currentViewDate.setFullYear(currentViewDate.getFullYear() + 1);

            updateCostsPeriodDisplay();
            drawDailyCostChart();
            drawCostPie();
        });
    }

    // 3b. Date Picker Accueil
    const homeDateSelector = document.getElementById('homeDateSelector');
    const homeDatePicker = document.getElementById('homeDatePicker');
    const prevDayHomeBtn = document.getElementById('prevDayHome');
    const nextDayHomeBtn = document.getElementById('nextDayHome');

    if (homeDatePicker) {
        homeDatePicker.value = toLocalISOString(homeViewDate);
        updateHomePeriodDisplay(); // Affichage initial

        homeDatePicker.addEventListener('change', (e) => {
            if (homeRange === 'month') {
                const [year, month] = e.target.value.split('-');
                homeViewDate = new Date(year, month - 1, 1);
            } else if (homeRange === 'year') {
                homeViewDate.setFullYear(parseInt(e.target.value, 10));
            } else { // 'day'
                homeViewDate = new Date(e.target.value);
            }
            updateHomePeriodDisplay();
            updateHomeChart();
        });

        prevDayHomeBtn.addEventListener('click', () => {
            if (homeRange === 'day') {
                homeViewDate.setDate(homeViewDate.getDate() - 1);
            } else if (homeRange === 'month') {
                homeViewDate.setMonth(homeViewDate.getMonth() - 1);
            } else if (homeRange === 'year') {
                homeViewDate.setFullYear(homeViewDate.getFullYear() - 1);
            }
            updateHomePeriodDisplay();
            updateHomeChart();
        });

        nextDayHomeBtn.addEventListener('click', () => {
            if (homeRange === 'day') {
                homeViewDate.setDate(homeViewDate.getDate() + 1);
            } else if (homeRange === 'month') {
                homeViewDate.setMonth(homeViewDate.getMonth() + 1);
            } else if (homeRange === 'year') {
                homeViewDate.setFullYear(homeViewDate.getFullYear() + 1);
            }
            updateHomePeriodDisplay();
            updateHomeChart();
        });

        homeDateSelector.style.display = 'flex'; // Afficher par défaut car la vue initiale est 'jour'
    }
    
    // 4. Capteurs
    document.querySelectorAll('.sensor-select-all').forEach(selectElement => {
        selectElement.addEventListener('change', (e) => {
            const newMac = e.target.value;
            setSelectedMac(newMac);
        });
    });
}

function updateHomePeriodDisplay() {
    const labelEl = document.getElementById('homeDatePicker');
    if (!labelEl) return;

    if (homeRange === 'year') {
        labelEl.type = 'number';
        labelEl.value = homeViewDate.getFullYear(); // Affiche l'année
    } else if (homeRange === 'month') {
        labelEl.type = 'month';
        labelEl.value = `${homeViewDate.getFullYear()}-${String(homeViewDate.getMonth() + 1).padStart(2, '0')}`; // Format YYYY-MM
    } else { // 'day'
        labelEl.type = 'date';
        labelEl.value = toLocalISOString(homeViewDate);
    }
}

function updateCostsPeriodDisplay() {
    const labelEl = document.getElementById('costsDatePicker');
    if (!labelEl) return;

    if (costsRange === 'year') {
        labelEl.value = currentViewDate.getFullYear();
    } else if (costsRange === 'month') {
        labelEl.value = currentViewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (costsRange === 'week') {
        const { labelObj } = calculateDateRange('week', currentViewDate);
        const s = new Date(labelObj.start);
        const e = new Date(labelObj.end);
        const startMonth = s.toLocaleDateString('fr-FR', { month: 'short' });
        const endMonth = e.toLocaleDateString('fr-FR', { month: 'short' });
        labelEl.value = `${s.getDate()} ${startMonth} - ${e.getDate()} ${endMonth}`;
    }
}

function setSelectedMac(newMac) {
    selectedMac = newMac;
    document.querySelectorAll('.sensor-select-all').forEach(o => o.value = newMac);
    updateHomeChart(); drawDailyCostChart(); drawVolumePie(); drawCostPie();
}

function populateSensorSelectors() {
    document.querySelectorAll('.sensor-select-all').forEach(select => {
        select.innerHTML = `<option value="ALL">Tous les capteurs</option>` + Object.keys(sensorConfig).map(mac => `<option value="${mac}">${sensorConfig[mac].name}</option>`).join('');
    });
}

// ==========================================
// 7. GESTION DU PROFIL (AJOUTÉ)
// ==========================================

async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE_URL}get_profile.php`);
        if (!res.ok) throw new Error(`Échec du chargement du profil (HTTP ${res.status})`);

        const user = await res.json();
        if (!user || !user.id) return; 

        document.getElementById('input-nom').value = user.nom || '';
        document.getElementById('input-prenom').value = user.prenom || '';
        document.getElementById('input-habitudes').value = user.habitudes || '';
        document.getElementById('input-departement').value = user.departement || '';
        document.getElementById('input-departement').value = user.departement || '';
        document.getElementById('input-sportif').checked = user.is_sportif == 1;
        
        if (user.avatar) {
            const imgUrl = `${user.avatar}?t=${new Date().getTime()}`;
            document.getElementById('profile-img-preview').src = imgUrl;
            document.getElementById('menu-avatar').src = imgUrl;
        }
        
        document.getElementById('menu-username').textContent = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';

    } catch (err) {
        console.error("Erreur chargement profil:", err);
        // Si l'erreur vient du fetch (ex: 404), on n'affiche pas de notification
        // car le problème est probablement côté serveur et non une action utilisateur.
        if (err.message.includes("JSON")) {
             showNotification("Erreur de réponse du serveur pour le profil.", true);
        }
    }
}

async function saveProfile() {
    const formData = new FormData(document.getElementById('profile-form'));
    const fileInput = document.getElementById('profile-input-file');
    if (fileInput.files[0]) {
        formData.append('avatar', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_BASE_URL}update_profile.php`, { method: 'POST', body: formData });
        const result = await res.json();
        
        if (result.success) {
            showNotification("Profil mis à jour !"); 
            await loadProfile();
            await refreshUserList();
        } else {
            showNotification("Erreur: " + result.error, true); 
        }
    } catch (err) {
        showNotification("Erreur technique de connexion.", true); 
    }
}

function setupProfileInteractions() {
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const fileInput = document.getElementById('profile-input-file');

    avatarWrapper?.addEventListener('click', () => fileInput.click()); // L'input est caché, on simule un clic

    fileInput?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => document.getElementById('profile-img-preview').src = e.target.result;
            reader.readAsDataURL(file);
        }
    });
}

// Affiche la liste des utilisateurs dans la vue profil
async function refreshUserList() {
    if (!document.getElementById('user-list')) return;

    try {
        const res = await fetch(`${API_BASE_URL}get_users_list.php`);
        const data = await res.json();
        
        const userListEl = document.getElementById('user-list');
        document.getElementById('user-count').textContent = data.count;
        userListEl.innerHTML = '';

        data.users.forEach(user => {
            const li = document.createElement('li');
            
            const infoParts = [];
            if (user.age) infoParts.push(`${user.age} ans`);
            if (user.genre && user.genre !== 'Non précisé') infoParts.push(user.genre);
            if (user.is_sportif == 1) infoParts.push('Sportif');
            const infoString = infoParts.join(' - ');
            const nameDisplay = user.prenom || 'Nouveau membre';
            
            li.innerHTML = `
                <div class="user-info">
                    <span>${nameDisplay}</span>
                    ${infoString ? `<span>${infoString}</span>` : ''}
                </div>
                <button onclick="deleteUser(${user.id})" class="delete-user-btn">❌</button>
            `;
            userListEl.appendChild(li);
        });

    } catch (err) {
        console.error("Erreur de rafraîchissement de la liste utilisateur:", err);
    }
}

// Ajoute un nouvel utilisateur
async function addUser() {
    const newPrenom = prompt("Entrez le PRÉNOM du nouveau membre :");
    if (!newPrenom || newPrenom.trim() === '') {
        showNotification("Ajout annulé. Le prénom est obligatoire.", true);
        return;
    }

    const newAge = prompt(`Quel est l'âge de ${newPrenom} ? (Optionnel)`);
    let newGenreInput = prompt(`Genre de ${newPrenom} ?\nEntrez 'H' pour Homme, 'F' pour Femme, ou laissez vide.`);
    let newGenre = 'Non précisé';
    if (newGenreInput) {
        const inputUpper = newGenreInput.trim().toUpperCase();
        if (inputUpper === 'H') newGenre = 'Homme';
        else if (inputUpper === 'F') newGenre = 'Femme';
    }

    // Étape 4 : Sportif (Optionnel)
    const isSportif = confirm(`Est-ce que ${newPrenom} est sportif/sportive ?`);
    
    const formData = new FormData();
    formData.append('prenom', newPrenom);
    formData.append('is_main_user', '0');
    formData.append('age', newAge || '');
    formData.append('genre', newGenre);
    formData.append('is_sportif', isSportif ? '1' : '0');

    try {
        const res = await fetch(`${API_BASE_URL}add_user.php`, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            showNotification(`Membre ${newPrenom} ajouté.`);
            refreshUserList(); 
        } else {
            showNotification(`Erreur: ${result.error}`, true);
        }
    } catch (err) {
        showNotification("Erreur technique lors de l'ajout.", true);
    }
}

// Supprime un utilisateur
async function deleteUser(userId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;
    
    const res = await fetch(`${API_BASE_URL}delete_user.php?id=${userId}`);
    const result = await res.json();
    showNotification(result.success ? "Membre supprimé." : `Erreur: ${result.error}`, !result.success);
    if (result.success) refreshUserList();
}

// ==========================================
// 8. RECOMMANDATIONS INTELLIGENTES
// ==========================================

// --- Données de référence (à enrichir ou externaliser si besoin) ---

/**
 * Consommation moyenne journalière en LITRES pour un adulte non sportif.
 * Source: Données utilisateur (valeurs annuelles en m³ converties).
 * Calcul : (valeur_m3 * 1000) / 365
 */
const CONSO_MOYENNE_DEPARTEMENT = {
    '01': 149, '02': 127, '03': 153, '04': 156, '05': 98, '06': 221, '07': 127, '08': 126, '09': 127,
    '10': 145, '11': 176, '12': 162, '13': 172, '14': 119, '15': 158, '16': 130, '17': 169, '18': 143, '19': 150,
    '2A': 158, '2B': 158, '21': 142, '22': 112, '23': 142, '24': 152, '25': 130, '26': 147, '27': 130, '28': 133, '29': 122,
    '30': 144, '31': 153, '32': 164, '33': 136, '34': 163, '35': 114, '36': 166, '37': 142, '38': 150, '39': 145,
    '40': 188, '41': 150, '42': 129, '43': 121, '44': 124, '45': 146, '46': 164, '47': 119, '48': 107, '49': 126,
    '50': 128, '51': 147, '52': 112, '53': 139, '54': 128, '55': 127, '56': 143, '57': 131, '58': 145, '59': 113,
    '60': 122, '61': 132, '62': 114, '63': 132, '64': 159, '65': 158, '66': 124, '67': 150, '68': 144, '69': 138,
    '70': 130, '71': 143, '72': 124, '73': 114, '74': 143, '75': 169, '76': 131, '77': 138, '78': 147,
    '79': 144, '80': 139, '81': 140, '82': 140, '83': 144, '84': 158, '85': 172, '86': 151, '87': 129, '88': 125, '89': 138,
    '90': 123, '91': 143, '92': 169, '93': 169, '94': 169, '95': 138,
    '971': 207, '972': 173, '973': 118, '974': 233, '976': 96,
    'default': 148 // Moyenne nationale si département non trouvé
};

/**
 * Noms des départements français pour l'affichage.
 */
const DEPARTEMENTS_NOMS = {
    '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
    '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
    '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
    '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud',
    '2B': 'Haute-Corse', '21': 'Côte-d\'Or', '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne',
    '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard',
    '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine',
    '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher',
    '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
    '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne',
    '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
    '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées',
    '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
    '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime',
    '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
    '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
    '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
    '94': 'Val-de-Marne', '95': 'Val-d\'Oise', '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
    '974': 'La Réunion', '976': 'Mayotte'
};

/**
 * Répartition de la consommation idéale par poste, adaptée aux capteurs de l'application.
 * Source: Données utilisateur.
 * - Douche = Bains-douches (39%)
 * - Lave-linge = Linge (12%)
 * - Cuisine = Vaisselle (10%) + Cuisine (6%) + Boisson (1%) = 17%
 * - Robinet Ext. = Voiture/Jardin (6%)
 * - Le reste (Sanitaires, Divers) est regroupé dans "Autres".
 */
const REPARTITION_CONSO_IDEALE = {
    'Douche': 0.39,       // Bains-douches
    'Lave-linge': 0.12,   // Linge
    'Cuisine': 0.17,      // Vaisselle + Cuisine + Boisson
    'Robinet Ext.': 0.06, // Voiture - jardin
    'Autres': 0.26        // Sanitaires (20%) + Divers (1%) = 21%, ajusté pour que le total fasse 100%
};

const AGE_CATEGORIES = {
    ENFANT: { max: 17, coeff: 0.4 },
    ADULTE: { max: 64, coeff: 1.0 },
    SENIOR: { max: 150, coeff: 0.7 }
};

const SPORTIF_COEFF = 1.6;

async function generateRecommendations() {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '<p style="text-align: center; color: var(--muted);">Analyse en cours, veuillez patienter... 🤖</p>';

    try {
        // 1. Récupérer les données nécessaires
        const [usersRes, profileRes] = await Promise.all([
            fetch(`${API_BASE_URL}get_users_list.php`),
            fetch(`${API_BASE_URL}get_profile.php`)
        ]);

        if (!usersRes.ok) throw new Error(`Erreur chargement liste utilisateurs (HTTP ${usersRes.status})`);
        if (!profileRes.ok) throw new Error(`Erreur chargement profil (HTTP ${profileRes.status})`);

        const usersData = await usersRes.json();
        const profileData = await profileRes.json();

        const departement = profileData.departement;
        if (!departement) {
            // On ne bloque plus, on continue avec la moyenne nationale
            const message = `
                <p style="text-align: center; color: var(--warning-color);">
                    💡 Pour une analyse plus précise, renseignez votre département dans "Mon Profil".
                </p>`;
            container.innerHTML = message;
        }

        // 2. Calculer la consommation journalière idéale du foyer
        const consoAdulteRef = CONSO_MOYENNE_DEPARTEMENT[departement] || CONSO_MOYENNE_DEPARTEMENT['default'];
        let totalConsoIdealeJour = 0;

        usersData.users.forEach(user => {
            const age = parseInt(user.age, 10);
            let consoPersonne = 0;

            if (age <= AGE_CATEGORIES.ENFANT.max) {
                consoPersonne = consoAdulteRef * AGE_CATEGORIES.ENFANT.coeff;
                if (user.is_sportif == 1) {
                    consoPersonne *= SPORTIF_COEFF;
                }
            } else if (age <= AGE_CATEGORIES.ADULTE.max) {
                consoPersonne = consoAdulteRef * AGE_CATEGORIES.ADULTE.coeff;
                if (user.is_sportif == 1) {
                    consoPersonne *= SPORTIF_COEFF;
                }
            } else {
                consoPersonne = consoAdulteRef * AGE_CATEGORIES.SENIOR.coeff;
            }
            totalConsoIdealeJour += consoPersonne;
        });

        const totalConsoIdealeSemaine = totalConsoIdealeJour * 7;

        // 3. Récupérer la consommation réelle de la semaine passée
        const sevenDaysAgo = new Date();
        const { start, end } = calculateDateRange('week', recoViewDate); // Utilise la date du sélecteur via la variable globale recoViewDate
        
        const breakdownRes = await fetch(`${API_BASE_URL}get_breakdown.php?start=${start}&end=${end}`);
        if (!breakdownRes.ok) throw new Error(`Erreur chargement breakdown (HTTP ${breakdownRes.status})`);

        const realBreakdown = await breakdownRes.json();

        let totalConsoReelleSemaine = 0;
        const consoReelleParPoste = {}; // ex: { 'Douche': 150, 'Cuisine': 80 }
        realBreakdown.forEach(item => {
            const volume = parseFloat(item.volume_litres);
            const nomPoste = (sensorConfig[item.mac] && sensorConfig[item.mac].name) || 'Inconnu';
            totalConsoReelleSemaine += volume;
            consoReelleParPoste[nomPoste] = volume;
        });

        // 4. Construire et afficher le HTML
        let html = (container.innerHTML.includes('warning-color') ? container.innerHTML : ''); // Conserve le message d'avertissement s'il existe
        
        const nbMembres = usersData.users.length;
        const s = nbMembres > 1 ? 's' : ''; // Pour le pluriel de "personne"
        let infoText;
        if (departement) {
            const nomDepartement = DEPARTEMENTS_NOMS[departement] || `Département`;
            infoText = `<p class="reco-info-text">Consommation de référence pour un foyer de ${nbMembres} personne${s} vivant dans ${nomDepartement} (${departement}).</p>`;
        } else {
            infoText = `<p class="reco-info-text">Consommation de référence pour un foyer de ${nbMembres} personne${s} (basée sur la moyenne nationale).</p>`;
        }

        html += `
            <div class="card">
                <h3>📊 Bilan de la semaine</h3>
                ${infoText}
                <div class="reco-summary">
                    <div>
                        <span class="ideal">${Math.round(totalConsoIdealeSemaine)} L</span>
                        <span>Consommation Idéale</span>
                    </div>
                    <div>
                        <span class="real">${Math.round(totalConsoReelleSemaine)} L</span>
                        <span>Votre Consommation</span>
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
                <h3 style="margin-top: 0;">💧 Analyse par poste</h3>
        `;

        for (const poste in REPARTITION_CONSO_IDEALE) {
            if (poste === 'Autres') continue; // On n'affiche pas les "Autres"

            const consoIdealePoste = totalConsoIdealeSemaine * REPARTITION_CONSO_IDEALE[poste];
            const consoReellePoste = consoReelleParPoste[poste] || 0;
            const difference = consoReellePoste - consoIdealePoste;
            const emoji = difference > 0 ? '⚠️' : '✅';

            html += `
                <div class="reco-item">
                    <span class="reco-item-name">${emoji} ${poste}</span>
                    <span class="reco-item-values">
                        <span class="real-value">${Math.round(consoReellePoste)} L</span> / 
                        <span class="ideal-value">${Math.round(consoIdealePoste)} L</span>
                    </span>
                </div>
            `;
        }

        html += `</div>`;

        if (totalConsoReelleSemaine === 0) {
            html += `<p style="text-align: center; color: var(--muted); margin-top: 16px;">Aucune consommation enregistrée pour la semaine sélectionnée.</p>`;
        }

        container.innerHTML = html;

    } catch (error) {
        console.error("Erreur lors de la génération des recommandations:", error);
        let errorMessage = "Une erreur est survenue lors de l'analyse.";
        if (error instanceof SyntaxError) {
            errorMessage = "Erreur de format de réponse du serveur.";
        } else if (error.message.includes("HTTP")) {
            errorMessage = `Problème de communication avec le serveur (${error.message}).`;
        }
        container.innerHTML = `<p style="text-align: center; color: #f44336;">${errorMessage}</p>`;
    }
}

function getHomeChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false }, // Important pour le tooltip

        // AJOUT DE LA GESTION DU CLIC
        onClick: (event, elements) => {
            // On ne veut activer la modale que pour la vue "Jour" (qui est un graphique en barres)
            if (homeRange !== 'day' || elements.length === 0) {
                return;
            }
            
            const element = elements[0]; // On prend le premier élément cliqué
            const index = element.index;
            const dataset = chart.data.datasets[element.datasetIndex];
            
            const date = homeViewDate.toLocaleDateString('fr-FR');
            const time = chart.data.labels[index]; // ex: "14h"
            const liters = dataset.data[index];

            // Ouvre la modale seulement si la consommation n'est pas nulle
            if (liters > 0) {
                // On passe maintenant l'adresse MAC du capteur sélectionné
                // La variable globale `selectedMac` contient déjà cette information
                // Si `selectedMac` est 'ALL', on ne peut pas qualifier, donc on ne fait rien.
                if (selectedMac !== 'ALL')
                    openActivityModal(date, time, liters.toFixed(2), selectedMac);
            }
        },

        plugins: { legend: { display: false }, tooltip: { enabled: true, } },
        scales: { 
            x: { display: true, grid: { display: false } }, // Affiché par défaut, géré dynamiquement
            y: { min: 0, grid: { color: 'rgba(15,23,42,.08)' } } 
        }
    };
}

function applyChartStyles(chart, isDayView) {
    const dataset = chart.data.datasets[0];
    dataset.backgroundColor = isDayView ? 'rgba(11, 103, 255, 0.7)' : 'rgba(11,103,255,.12)';
    dataset.borderColor = '#0b67ff';
    dataset.fill = !isDayView;
    dataset.tension = isDayView ? 0 : 0.35;
    chart.options.scales.x.display = true; // Toujours afficher l'axe X
}

// ==========================================
// 8. GESTION DES CAPTEURS (NOUVEAU)
// ==========================================

async function loadSensorConfig() {
    try {
        const res = await fetch(`${API_BASE_URL}get_sensor_config.php`);
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        const data = await res.json();
        
        sensorConfig = {}; // Réinitialiser
        data.forEach(sensor => {
            sensorConfig[sensor.adresse_mac] = {
                name: sensor.nom,
                color: sensor.couleur
            };
        });
        
        console.log("Configuration des capteurs chargée :", sensorConfig);
        populateSensorSelectors(); // Mettre à jour les listes déroulantes partout
        await displaySensorConfigUI(); // Mettre à jour l'UI dans la page profil

    } catch (err) {
        console.error("Impossible de charger la configuration des capteurs:", err);
        showNotification("Erreur de chargement de la configuration des capteurs.", true);
    }
}

async function displaySensorConfigUI() {
    const container = document.getElementById('sensor-config-list');
    const addSensorFormContainer = document.getElementById('add-sensor-form-container');
    if (!container || !addSensorFormContainer) return;

    try {
        // On récupère toutes les adresses MAC, celles déjà configurées ET celles qui ont envoyé des données
        const res = await fetch(`${API_BASE_URL}get_all_known_sensors.php`);
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        const allKnownMacs = await res.json();

        if (allKnownMacs.length === 0) {
            container.innerHTML = '<p>Aucun capteur configuré ou détecté. Ajoutez votre premier capteur ci-dessous.</p>';
        } else {
            container.innerHTML = allKnownMacs.map(mac => {
            const config = sensorConfig[mac] || {};
            const name = config.name || '';
            return `
                <div class="sensor-config-item">
                    <label for="sensor-name-${mac}">${mac}</label>
                    <input type="text" id="sensor-name-${mac}" data-mac="${mac}" value="${name}" placeholder="Ex: Douche, Cuisine..." class="sensor-name-input">
                </div>
            `;
            }).join('');
        }

        // Afficher le formulaire d'ajout manuel
        addSensorFormContainer.innerHTML = `
            <form id="add-sensor-form" class="add-sensor-form">
                <input type="text" id="new-sensor-mac" placeholder="AA:BB:CC:DD:EE:FF" required>
                <input type="text" id="new-sensor-name" placeholder="Nom du point d'eau" required>
                <button type="submit">Ajouter</button>
            </form>
        `;

        document.getElementById('add-sensor-form').addEventListener('submit', addManualSensor);

    } catch (err) {
        console.error("Erreur lors de l'affichage de l'UI de configuration des capteurs:", err);
        container.innerHTML = '<p style="color: red;">Impossible de récupérer la liste des capteurs détectés.</p>';
    }
}

async function addManualSensor(event) {
    event.preventDefault();
    const macInput = document.getElementById('new-sensor-mac');
    const nameInput = document.getElementById('new-sensor-name');
    const mac = macInput.value.trim();
    const name = nameInput.value.trim();

    // Validation simple de l'adresse MAC
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(mac)) {
        showNotification("Format d'adresse MAC invalide.", true);
        return;
    }

    const newSensor = { mac: mac.toUpperCase(), name: name };
    const configToSave = [newSensor];

    try {
        const res = await fetch(`${API_BASE_URL}update_sensor_config.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configToSave)
        });
        const result = await res.json();
        if (result.success) {
            showNotification(`Capteur "${name}" ajouté !`);
            macInput.value = '';
            nameInput.value = '';
            await loadSensorConfig(); // Recharge toute la config et l'UI
        } else {
            showNotification("Erreur: " + (result.error || "Impossible d'ajouter le capteur."), true);
        }
    } catch (err) {
        console.error("Erreur lors de l'ajout manuel du capteur:", err);
        showNotification("Erreur de connexion pour l'ajout du capteur.", true);
    }
}

async function saveSensorConfig() {
    const inputs = document.querySelectorAll('#sensor-config-list input.sensor-name-input');
    const configToSave = Array.from(inputs).map(input => ({
        mac: input.dataset.mac,
        name: input.value
    }));

    try {
        const res = await fetch(`${API_BASE_URL}update_sensor_config.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configToSave)
        });
        const result = await res.json();
        if (result.success) {
            showNotification("Configuration des capteurs enregistrée !");
            await loadSensorConfig(); // Recharger pour mettre à jour toute l'app (y compris les listes déroulantes)
            setSelectedMac('ALL'); // Revenir à la vue "Tous les capteurs"
        } else {
            showNotification("Erreur: " + (result.error || "Impossible d'enregistrer."), true);
        }
    } catch (err) {
        console.error("Erreur lors de la sauvegarde de la config capteurs:", err);
        showNotification("Erreur de connexion pour la sauvegarde des capteurs.", true);
    }
}

// ----- Initialisation -----
(async () => {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    
    inputStart.value = `${y}-${m}-${d}`;
    inputEnd.value = `${y}-${m}-${d}`;

    chipStart.textContent = `Du ${new Date(inputStart.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    chipEnd.textContent = `Au ${new Date(inputEnd.value).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
    
    // Création graphique vide
    // On détermine le type initial : 'bar' si la vue par défaut est 'day', sinon 'line'.
    const initialChartType = (homeRange === 'day') ? 'bar' : 'line';
    chart = new Chart(ctx, {
        type: initialChartType,
        data: { labels: [], datasets: [{ data: [] }] },
        options: getHomeChartOptions()
    });

    await loadSensorConfig(); // NOUVEAU: Charger la config des capteurs en premier
    setupRangeListeners();
    setupProfileInteractions(); // Initialiser les interactions du profil
    await loadProfile(); // Charger les données du profil au démarrage
    await loadActivityData(); // NOUVEAU: Charger les données des activités
    await refreshUserList(); // Charger la liste des membres
    await loadObjectives(); // NOUVEAU: Charger les objectifs depuis la BDD
    // renderObjectives(); // Cet appel est maintenant dans loadObjectives()

    updateCostsPeriodDisplay();

    try {
        await updateDashboard();
        await updateHomeChart();
        await drawDailyCostChart();
        await drawVolumePie();
        await drawCostPie();
    } catch (e) {
        console.error("Erreur chargement initial", e);
    }

    // Initialisation du date picker des alertes
    const alertsDatePicker = document.getElementById('alerts-date-picker');
    if (alertsDatePicker) {
        alertsDatePicker.value = toLocalISOString(new Date());
    }

    // let counter = 0;
    // const updateInterval = 60000; 
    // --- NOUVEAU : Rafraîchissement automatique des données ---
    const REALTIME_UPDATE_INTERVAL = 1000; // en millisecondes (1 seconde pour plus de réactivité)

    // setInterval(async () => {
    //     const activeMac = simulatedMacs[Math.floor(Math.random() * simulatedMacs.length)];
    //     const newValue = (Math.random() * 2 + 1).toFixed(2); 

    //     await fetch(`${API_BASE_URL}insert_data.php`, { 
    //         method: 'POST', headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ valeur: parseFloat(newValue), adresse_mac_capteur: activeMac })
    //     });

    //     await updateDashboard();
    //     await updateHomeChart();

    //     if (counter % (updateInterval / 2000) === 0) {
    //         const now = new Date();
    //         if (toLocalISOString(currentViewDate) === toLocalISOString(now)) {
    //              await drawDailyCostChart(); 
    //              await drawCostPie();
    //         }
    //         await drawVolumePie();
    //     }
    //     counter++;
    // }, 2000); 
    setInterval(async () => {
        // On ne met à jour que si l'utilisateur est sur la page d'accueil
        if (viewHome.classList.contains('active')) {
            console.log("Rafraîchissement automatique des données...");
            
            // Met à jour le gros compteur (KPI)
            await updateDashboard(); 
            
            // Met à jour le graphique principal
            await updateHomeChart();
        }
    }, REALTIME_UPDATE_INTERVAL);
})();

/* PWA disabled */