/* ============================================================
   NEEF-UA — admin.js
   Admin dashboard: event list, CRUD, form panel, filters
   Depends on: events.js (loaded first)
   ============================================================ */

/* ── AUTH GUARD ─────────────────────────────────────────── */
if (!sessionStorage.getItem('neef_admin')) {
  window.location.replace('admin-login.html');
}

/* ── STATE ──────────────────────────────────────────────── */
let currentFilter = 'all';  /* 'all' | 'upcoming' | 'past' */
let editingId     = null;   /* null = adding new, string = editing */

/* ── DOM REFS ───────────────────────────────────────────── */
const listEl       = document.getElementById('admin-events-list');
const formPanel    = document.getElementById('event-form-panel');
const overlay      = document.getElementById('panel-overlay');
const eventForm    = document.getElementById('event-form');
const panelTitle   = document.getElementById('form-panel-title');
const submitBtn    = document.getElementById('form-submit-btn');
const statsTotal   = document.getElementById('stats-total');
const statsUp      = document.getElementById('stats-upcoming');
const statsPast    = document.getElementById('stats-past');
const toast        = document.getElementById('admin-toast');

/* ── RENDER LIST ────────────────────────────────────────── */
function renderList() {
  const all = neefGetEvents();

  /* Update stat chips */
  const upcomingAll = all.filter(neefIsUpcoming);
  const pastAll     = all.filter(e => !neefIsUpcoming(e));
  statsTotal.textContent = all.length;
  statsUp.textContent    = upcomingAll.length;
  statsPast.textContent  = pastAll.length;

  /* Filter */
  let events;
  if (currentFilter === 'upcoming') events = neefSortByDate(upcomingAll, true);
  else if (currentFilter === 'past') events = neefSortByDate(pastAll, false);
  else events = neefSortByDate(upcomingAll, true).concat(neefSortByDate(pastAll, false));

  /* Empty state */
  if (events.length === 0) {
    listEl.innerHTML =
      '<div class="admin-empty">Nenhum evento encontrado para este filtro.</div>';
    return;
  }

  listEl.innerHTML = events.map(renderRow).join('');

  /* Attach per-row listeners */
  listEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditForm(btn.dataset.id));
  });
  listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => showDeleteConfirm(btn.dataset.id));
  });
}

/* ── RENDER A SINGLE ROW ────────────────────────────────── */
function renderRow(event) {
  const { day, month, year } = neefFormatDate(event.date);
  const upcoming = neefIsUpcoming(event);
  const timeStr  = neefFormatTime(event.time);

  return `
    <div class="admin-row ${upcoming ? '' : 'row-past'}" data-id="${event.id}">
      <div class="admin-row-date">
        <span class="row-day">${String(day).padStart(2, '0')} ${month}</span>
        <span class="row-year">${year}</span>
      </div>
      <span class="admin-cat-badge" data-cat="${neefEscape(event.category)}">${neefEscape(event.category)}</span>
      <div class="admin-row-info">
        <strong>${neefEscape(event.title)}</strong>
        <span class="row-meta">
          <span>${neefEscape(timeStr)}</span>
          <span class="row-dot">·</span>
          <span>${neefEscape(event.location)}</span>
        </span>
      </div>
      <div class="admin-row-actions" id="actions-${event.id}">
        <button class="admin-icon-btn btn-edit-icon" data-action="edit" data-id="${event.id}" aria-label="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="admin-icon-btn btn-delete-icon" data-action="delete" data-id="${event.id}" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>`;
}

/* ── DELETE CONFIRM (inline) ────────────────────────────── */
function showDeleteConfirm(id) {
  const actionsDiv = document.getElementById('actions-' + id);
  if (!actionsDiv) return;

  actionsDiv.innerHTML = `
    <span class="delete-prompt">Eliminar?</span>
    <button class="admin-confirm-btn btn-yes" aria-label="Confirmar eliminação">Sim</button>
    <button class="admin-confirm-btn btn-no"  aria-label="Cancelar eliminação">Não</button>`;

  actionsDiv.querySelector('.btn-yes').addEventListener('click', () => {
    neefDeleteEvent(id);
    showToast('Evento eliminado.', 'neutral');
    renderList();
  });
  actionsDiv.querySelector('.btn-no').addEventListener('click', renderList);
}

/* ── FORM PANEL — OPEN / CLOSE ──────────────────────────── */
function openPanel() {
  formPanel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  /* Focus first field */
  setTimeout(() => document.getElementById('f-title').focus(), 50);
}

function closePanel() {
  formPanel.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
  eventForm.reset();
  clearFormErrors();
}

function openAddForm() {
  editingId = null;
  eventForm.reset();
  clearFormErrors();
  panelTitle.textContent  = 'Novo Evento';
  submitBtn.textContent   = 'Adicionar Evento';
  openPanel();
}

function openEditForm(id) {
  const ev = neefGetEvents().find(e => e.id === id);
  if (!ev) return;
  editingId = id;

  document.getElementById('f-title').value       = ev.title;
  document.getElementById('f-date').value        = ev.date;
  document.getElementById('f-time').value        = ev.time;
  document.getElementById('f-location').value   = ev.location;
  document.getElementById('f-category').value   = ev.category;
  document.getElementById('f-description').value = ev.description;
  document.getElementById('f-image').value       = ev.imageUrl || '';

  clearFormErrors();
  panelTitle.textContent = 'Editar Evento';
  submitBtn.textContent  = 'Guardar Alterações';
  openPanel();
}

/* ── FORM VALIDATION ────────────────────────────────────── */
function validateForm() {
  const required = ['f-title', 'f-date', 'f-time', 'f-location', 'f-description'];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add('input-error');
      valid = false;
    } else {
      el.classList.remove('input-error');
    }
  });
  return valid;
}

function clearFormErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

/* ── FORM SUBMIT ────────────────────────────────────────── */
eventForm.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!validateForm()) {
    showToast('Preenche os campos obrigatórios.', 'error');
    return;
  }

  const data = {
    title:       document.getElementById('f-title').value.trim(),
    date:        document.getElementById('f-date').value,
    time:        document.getElementById('f-time').value,
    location:    document.getElementById('f-location').value.trim(),
    category:    document.getElementById('f-category').value,
    description: document.getElementById('f-description').value.trim(),
    imageUrl:    document.getElementById('f-image').value.trim()
  };

  if (editingId) {
    neefUpdateEvent(editingId, data);
    showToast('Evento atualizado com sucesso!');
  } else {
    neefAddEvent(data);
    showToast('Novo evento adicionado!');
  }

  closePanel();
  renderList();
});

/* Remove error styling on input */
eventForm.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('input-error'));
});

/* ── TOAST ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = 'admin-toast visible' + (type ? ' toast-' + type : ' toast-success');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

/* ── FILTER TABS ────────────────────────────────────────── */
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderList();
  });
});

/* ── HEADER BUTTONS ─────────────────────────────────────── */
document.getElementById('add-event-btn').addEventListener('click', openAddForm);

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('neef_admin');
  window.location.replace('admin-login.html');
});

/* ── PANEL CLOSE TRIGGERS ───────────────────────────────── */
document.getElementById('form-panel-close').addEventListener('click', closePanel);
document.getElementById('form-cancel-btn').addEventListener('click', closePanel);
overlay.addEventListener('click', closePanel);

/* Close panel on Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && formPanel.classList.contains('open')) closePanel();
});

/* ── INIT ───────────────────────────────────────────────── */
renderList();
