// ==========================================
// 1. NAVIGATION ET INTERFACE
// ==========================================
const API_BASE_URL = '/brz/backend/'; // Chemin ABSOLU depuis la racine du serveur

const viewSplash = document.getElementById('view-splash');
const viewQuote = document.getElementById('view-quote');
const viewHome = document.getElementById('view-home');
const viewCosts = document.getElementById('view-costs'); 
const viewProfile = document.getElementById('view-profile');
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
overlay?.addEventListener('click', closeMenu);

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

// Date curseur pour la navigation historique (Onglet Coûts)
let currentViewDate = new Date(); 
let recoViewDate = new Date(); // NOUVEAU: Date curseur pour les recommandations

const simulatedMacs = ['00:1A:2B:3C:4D:01', '00:1A:2B:3C:4D:02', '00:1A:2B:3C:4D:03', '00:1A:2B:3C:4D:04'];
const macNames = { '00:1A:2B:3C:4D:01': 'Douche', '00:1A:2B:3C:4D:02': 'Lave-linge', '00:1A:2B:3C:4D:03': 'Cuisine', '00:1A:2B:3C:4D:04': 'Robinet Ext.' };
const macColors = { '00:1A:2B:3C:4D:01': '#0b67ff', '00:1A:2B:3C:4D:02': '#ff8c1a', '00:1A:2B:3C:4D:03': '#10bffd', '00:1A:2B:3C:4D:04': '#4caf50' };


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

function updatePeriodDisplay() {
    const labelEl = document.getElementById('currentPeriodLabel');
    if (!labelEl) return;

    if (costsRange === 'year') {
        labelEl.textContent = currentViewDate.getFullYear();
    } else if (costsRange === 'month') {
        labelEl.textContent = currentViewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (costsRange === 'week') {
        const { labelObj } = calculateDateRange('week', currentViewDate);
        const s = new Date(labelObj.start);
        const e = new Date(labelObj.end);
        labelEl.textContent = `${s.getDate()} ${s.toLocaleDateString('fr-FR', {month:'short'})} - ${e.getDate()} ${e.toLocaleDateString('fr-FR', {month:'short'})}`;
    } else {
        labelEl.textContent = "En cours";
    }
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
            if (groupByType === 'month') label = new Date(d.date_mesure).toLocaleDateString('fr-FR', { month:'short', year:'2-digit' });
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
    const { start, end } = calculateDateRange(homeRange, new Date()); 
    try {
        const points = await fetchData(start, end, homeRange); 
        if (chart) {
            chart.data.labels = points.map(p => p.x);
            chart.data.datasets[0].data = points.map(p => p.y);
            chart.options.scales.x.display = homeRange !== 'day'; 
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

        const labels = data.map(d => macNames[d.mac] || d.mac);
        const backgroundColors = data.map(d => macColors[d.mac] || '#cccccc');
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
            
            updatePeriodDisplay();
            drawDailyCostChart();
            drawCostPie(); 
        }
    });
    
    // 3. Date Picker
    const datePicker = document.getElementById('costs-date-picker');
    if (datePicker) {
        datePicker.value = toLocalISOString(new Date());
        datePicker.addEventListener('change', (e) => {
            const [y, m, d] = e.target.value.split('-');
            currentViewDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            updatePeriodDisplay();
            drawDailyCostChart();
            drawCostPie();
        });
    }
    
    // 4. Capteurs
    document.querySelectorAll('.sensor-select-all').forEach(selectElement => {
        selectElement.addEventListener('change', (e) => {
            const newMac = e.target.value;
            selectedMac = newMac;
            document.querySelectorAll('.sensor-select-all').forEach(o => { if (o !== e.target) o.value = newMac; });
            updateHomeChart(); drawDailyCostChart(); drawVolumePie(); drawCostPie();
        });
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
        const consoReelleParPoste = {};
        realBreakdown.forEach(item => {
            const volume = parseFloat(item.volume_litres);
            const nomPoste = macNames[item.mac] || 'Inconnu';
            totalConsoReelleSemaine += volume;
            consoReelleParPoste[nomPoste] = volume;
        });

        // 4. Construire et afficher le HTML
        let html = (container.innerHTML.includes('warning-color') ? container.innerHTML : ''); // Conserve le message d'avertissement s'il existe
        html += `
            <div class="reco-card">
                <h3>📊 Bilan de la semaine</h3>
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
            </div>
            <div class="reco-card">
                <h3>💧 Analyse par poste</h3>
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
    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#0b67ff', backgroundColor: 'rgba(11,103,255,.12)', fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: '#ff8c1a', pointHoverRadius: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            scales: { x: { display: false }, y: { min: 0, grid: { color: 'rgba(15,23,42,.08)' } } }
        }
    });

    setupRangeListeners();
    setupProfileInteractions(); // Initialiser les interactions du profil
    await loadProfile(); // Charger les données du profil au démarrage
    await refreshUserList(); // Charger la liste des membres

    updatePeriodDisplay();

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
})();

/* PWA disabled */