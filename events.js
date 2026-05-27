/* ============================================================
   NEEF-UA — events.js
   Shared event data layer + public page renderer
   Loaded on: index.html (render only) · admin.html (full CRUD)
   ============================================================ */

const NEEF_EVENTS_KEY = 'neef_events';

/* ── DEFAULT EVENTS (shown when localStorage is empty) ──── */
const NEEF_DEFAULT_EVENTS = [
  {
    id: 'default-1',
    title: 'Física Quântica e Computação do Futuro',
    date: '2026-06-15',
    time: '18:00',
    location: 'Anfiteatro IV, DFis',
    description: 'Uma conversa sobre como a mecânica quântica está a transformar a computação moderna e o que isso significa para os engenheiros de amanhã.',
    category: 'Palestra',
    imageUrl: ''
  },
  {
    id: 'default-2',
    title: 'Python para Simulação Física',
    date: '2026-06-22',
    time: '14:00',
    location: 'Sala 9.2.11, DFis',
    description: 'NumPy, SciPy e visualização científica com Matplotlib para modelar fenómenos físicos reais com precisão científica.',
    category: 'Workshop',
    imageUrl: ''
  },
  {
    id: 'default-3',
    title: 'Visita ao Instituto de Telecomunicações',
    date: '2026-07-05',
    time: '10:00',
    location: 'IT Aveiro',
    description: 'Laboratórios de investigação e projetos em curso no IT de Aveiro — óptica, fotónica e redes de nova geração.',
    category: 'Visita',
    imageUrl: ''
  },
  {
    id: 'default-4',
    title: 'Jantar de Fim de Semestre',
    date: '2026-07-12',
    time: '20:00',
    location: 'A confirmar',
    description: 'O melhor momento do semestre para celebrar as vitórias e criar memórias com toda a família NEEF.',
    category: 'Convívio',
    imageUrl: ''
  },
  {
    id: 'default-5',
    title: 'Introdução à Fotónica Integrada',
    date: '2026-05-10',
    time: '17:00',
    location: 'Anfiteatro III, DFis',
    description: 'Últimos avanços em fotónica integrada e as suas aplicações em telecomunicações, computação e sensores de última geração.',
    category: 'Palestra',
    imageUrl: ''
  },
  {
    id: 'default-6',
    title: 'Workshop MATLAB para Engenheiros',
    date: '2026-04-20',
    time: '14:00',
    location: 'Sala 9.1.3, DFis',
    description: 'Sessão prática de MATLAB focada em análise de sinais, processamento de dados experimentais e visualização de resultados.',
    category: 'Workshop',
    imageUrl: ''
  }
];

/* ── CRUD ───────────────────────────────────────────────── */
function neefGetEvents() {
  try {
    const raw = localStorage.getItem(NEEF_EVENTS_KEY);
    return raw ? JSON.parse(raw) : NEEF_DEFAULT_EVENTS;
  } catch (e) {
    return NEEF_DEFAULT_EVENTS;
  }
}

function neefSaveEvents(events) {
  localStorage.setItem(NEEF_EVENTS_KEY, JSON.stringify(events));
}

function neefAddEvent(data) {
  const events = neefGetEvents();
  const event = { ...data, id: 'evt-' + Date.now() };
  events.push(event);
  neefSaveEvents(events);
  return event;
}

function neefUpdateEvent(id, data) {
  const events = neefGetEvents();
  const i = events.findIndex(e => e.id === id);
  if (i === -1) return null;
  events[i] = { ...events[i], ...data, id };
  neefSaveEvents(events);
  return events[i];
}

function neefDeleteEvent(id) {
  neefSaveEvents(neefGetEvents().filter(e => e.id !== id));
}

/* ── HELPERS ────────────────────────────────────────────── */
function neefIsUpcoming(event) {
  const [y, mo, d] = event.date.split('-').map(Number);
  const [h, m] = (event.time || '23:59').split(':').map(Number);
  return new Date(y, mo - 1, d, h, m) >= new Date();
}

function neefSortByDate(events, ascending) {
  return [...events].sort((a, b) => {
    const ta = new Date(a.date + 'T' + (a.time || '00:00'));
    const tb = new Date(b.date + 'T' + (b.time || '00:00'));
    return ascending ? ta - tb : tb - ta;
  });
}

function neefFormatDate(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return { day: d, month: months[mo - 1], year: y };
}

function neefFormatTime(t) {
  return t ? t.replace(':', 'h') : '';
}

function neefEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Category accent colors — keyed by category name */
const NEEF_CAT_COLOR = {
  'Palestra': 'var(--purple)',
  'Workshop': 'var(--blue)',
  'Visita':   'var(--green)',
  'Convívio': 'var(--amber)',
  'Outro':    'var(--text-lo)'
};

/* ── PUBLIC PAGE RENDERER ───────────────────────────────── */
(function initPublicEvents() {
  const upcomingEl = document.getElementById('events-upcoming');
  if (!upcomingEl) return; /* not on the public page */

  function buildCard(event, featured) {
    const { day, month } = neefFormatDate(event.date);
    const color = NEEF_CAT_COLOR[event.category] || 'var(--text-lo)';
    const timeStr = neefFormatTime(event.time);
    return `
      <div class="event-date">
        <span class="event-day">${String(day).padStart(2, '0')}</span>
        <span class="event-month">${month}</span>
      </div>
      <div class="event-info">
        <span class="event-type" style="color:${color}">${neefEscape(event.category)}</span>
        <h3>${neefEscape(event.title)}</h3>
        <p>${neefEscape(event.description)}</p>
        <div class="event-meta">
          <span>🕐 ${neefEscape(timeStr)}</span>
          <span>📍 ${neefEscape(event.location)}</span>
        </div>
      </div>`;
  }

  function render() {
    const all    = neefGetEvents();
    const upcoming = neefSortByDate(all.filter(neefIsUpcoming), true);
    const past     = neefSortByDate(all.filter(e => !neefIsUpcoming(e)), false);

    /* --- Upcoming --- */
    upcomingEl.innerHTML = '';
    if (upcoming.length === 0) {
      upcomingEl.innerHTML =
        '<div class="events-empty"><p>Não há eventos próximos de momento. Fica atento!</p></div>';
    } else {
      upcoming.forEach((ev, i) => {
        const card = document.createElement('div');
        card.className = 'event-card' + (i === 0 ? ' event-featured' : '') + ' fade-in';
        card.innerHTML = buildCard(ev, i === 0);
        upcomingEl.appendChild(card);
        /* staggered entrance */
        requestAnimationFrame(() => {
          card.style.transitionDelay = (i * 0.07) + 's';
          card.classList.add('visible');
        });
      });
    }

    /* --- Past --- */
    const pastSection  = document.getElementById('events-past-section');
    const pastGrid     = document.getElementById('events-past');
    const pastCountEl  = document.getElementById('past-events-count');
    if (!pastSection || !pastGrid) return;

    if (past.length === 0) {
      pastSection.style.display = 'none';
      return;
    }

    pastSection.style.display = '';
    if (pastCountEl) pastCountEl.textContent = past.length;

    pastGrid.innerHTML = '';
    past.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'event-card event-past fade-in visible';
      card.innerHTML = buildCard(ev, false);
      pastGrid.appendChild(card);
    });
  }

  render();

  /* past-events toggle */
  const toggleBtn = document.getElementById('toggle-past-btn');
  const pastGrid  = document.getElementById('events-past');
  if (toggleBtn && pastGrid) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pastGrid.style.display === 'none';
      pastGrid.style.display = isHidden ? '' : 'none';
      toggleBtn.classList.toggle('expanded', isHidden);
      toggleBtn.querySelector('span').textContent = isHidden
        ? 'Ocultar eventos passados'
        : 'Mostrar eventos passados';
    });
  }
})();
