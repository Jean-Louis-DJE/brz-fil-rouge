// ==========================================
// 1. NAVIGATION ET INTERFACE
// ==========================================

const viewSplash = document.getElementById('view-splash');
const viewQuote = document.getElementById('view-quote');
const viewHome = document.getElementById('view-home');
const viewCosts = document.getElementById('view-costs'); 

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

    url = `../backend/get_aggregated_data.php?start=${start}&end=${end}${macFilter}&group_by_period=${groupByType}`;
    
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
        const res = await fetch(`../backend/get_summary.php?start=${dateStart}&end=${dateEnd}`); 
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
        const res = await fetch(`../backend/get_daily_costs.php?start=${start}&end=${end}${macFilter}&group_by_period=${grouping}`); 
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
        const res = await fetch(`../backend/get_breakdown.php?start=${start}&end=${end}`);
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

    let counter = 0;
    const updateInterval = 60000; 

    setInterval(async () => {
        const activeMac = simulatedMacs[Math.floor(Math.random() * simulatedMacs.length)];
        const newValue = (Math.random() * 2 + 1).toFixed(2); 

        await fetch('../backend/insert_data.php', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valeur: parseFloat(newValue), adresse_mac_capteur: activeMac })
        });

        await updateDashboard();
        await updateHomeChart();

        if (counter % (updateInterval / 2000) === 0) {
            const now = new Date();
            if (toLocalISOString(currentViewDate) === toLocalISOString(now)) {
                 await drawDailyCostChart(); 
                 await drawCostPie();
            }
            await drawVolumePie();
        }
        counter++;
    }, 2000); 
})();

/* PWA disabled */