// ----- Views: Splash -> Quote -> Home -----
const viewSplash = document.getElementById('view-splash');
const viewQuote  = document.getElementById('view-quote');
const viewHome   = document.getElementById('view-home');

const goto = (el) => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  el.classList.add('active');
};

// Timeline d’entrée
setTimeout(() => goto(viewQuote), 1500);
setTimeout(() => goto(viewHome), 3000);

// ----- Menu latéral -----
const sideMenu = document.getElementById('side-menu');
const overlay  = document.getElementById('overlay');
const btnMenu  = document.getElementById('btn-menu');
const btnClose = document.getElementById('btn-close-menu');
const openMenuBtn = document.getElementById('openMenu');

function openMenu(){
  sideMenu.classList.add('open');
  overlay.classList.add('show');
}
function closeMenu(){
  sideMenu.classList.remove('open');
  overlay.classList.remove('show');
}
btnMenu?.addEventListener('click', openMenu);
openMenuBtn?.addEventListener('click', openMenu);
btnClose?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);

// ----- Sélection de dates -----
const chipStart = document.getElementById('chip-start');
const chipEnd   = document.getElementById('chip-end');
const inputStart = document.getElementById('dateStart');
const inputEnd   = document.getElementById('dateEnd');

// Quand on clique sur le bouton, on déclenche le calendrier caché
chipStart.addEventListener('click', () => inputStart.showPicker && inputStart.showPicker());
chipEnd.addEventListener('click', () => inputEnd.showPicker && inputEnd.showPicker());

// Quand on choisit une date, on met à jour le texte du bouton
inputStart.addEventListener('change', () => {
  const date = new Date(inputStart.value);
  chipStart.textContent = `Du ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
});
inputEnd.addEventListener('change', () => {
  const date = new Date(inputEnd.value);
  chipEnd.textContent = `Au ${date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'2-digit' })} ▾`;
});

// ----- Chargement des données depuis le backend -----
async function fetchData() {
  try {
    const res = await fetch('backend/get_data.php');
    const json = await res.json();
    return json.map(d => ({
      x: new Date(d.date_mesure).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
      y: parseFloat(d.valeur)
    }));
  } catch (err) {
    console.error("Erreur de récupération :", err);
    return [];
  }
}



// ----- Chart.js: courbe en temps réel -----
(async () => {
  const litersEl = document.getElementById('litersValue');
  const ctx = document.getElementById('historyChart').getContext('2d');
  
  // Données du backend
  const points = await fetchData();
  const labels = points.map(p => p.x);
  const data = points.map(p => p.y);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#0b67ff',
        backgroundColor: 'rgba(11,103,255,.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#ff8c1a',
        pointHoverRadius: 4
      }]
    },
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

  // Simulation d’une nouvelle mesure toutes les 10s
  setInterval(async () => {
    const newValue = (Math.random() * 2 + 2.5).toFixed(2);

    // Envoie au backend
    await fetch('backend/insert_data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valeur: newValue })
    });

    // Mise à jour graphique
    chart.data.labels.push(new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }));
    chart.data.labels.shift();
    chart.data.datasets[0].data.push(parseFloat(newValue));
    chart.data.datasets[0].data.shift();
    chart.update('none');

    const current = parseInt(litersEl.textContent, 10);
    litersEl.textContent = String(current + Math.floor(1 + Math.random() * 2));
  }, 10000);
})();




// ----- PWA (service worker) -----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(console.warn);
  });
}
