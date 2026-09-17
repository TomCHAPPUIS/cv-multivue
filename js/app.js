let currentView = 'timeline';
let activeFilter = null;

document.addEventListener('DOMContentLoaded', () => {
  renderProfil();
  renderLangues();
  renderView('timeline');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = null;
      renderView(btn.dataset.view);
    });
  });
});

// ── Data helpers ────────────────────────────────────────────────────────────

function getAllItems() {
  const all = [
    ...CV.experiences.map(e => ({ ...e, category: 'experience' })),
    ...CV.formations.map(f => ({ ...f, category: 'formation' })),
    ...CV.projets.map(p => ({ ...p, category: 'projet' }))
  ];
  return all.sort((a, b) => {
    const aFin = a.fin ?? 9999;
    const bFin = b.fin ?? 9999;
    if (bFin !== aFin) return bFin - aFin;
    return b.debut - a.debut;
  });
}

function formatPeriode(item) {
  const fin = item.actuel ? 'auj.' : item.fin;
  return `${item.debut}–${fin}`;
}

// ── View dispatcher ──────────────────────────────────────────────────────────

function renderView(view) {
  currentView = view;
  const header  = document.getElementById('view-header');
  const content = document.getElementById('content');
  const filters = document.getElementById('sidebar-filters');

  content.innerHTML = '';
  filters.innerHTML = '';

  const titles = {
    timeline:   'Parcours chronologique',
    domaines:   'Par domaine',
    competences:'Par compétence'
  };
  header.innerHTML = `<h2>${titles[view]}</h2>`;

  if (view === 'timeline') {
    renderTimeline(content);
  } else if (view === 'domaines') {
    renderDomaineFilters(filters);
    renderDomaines(content);
  } else if (view === 'competences') {
    renderCompetenceFilters(filters);
    renderCompetences(content);
  }
}

// ── Timeline ─────────────────────────────────────────────────────────────────

function renderTimeline(container) {
  const items = getAllItems();
  const html = `<div class="timeline">${items.map(item => `
    <div class="timeline-item">
      <div class="timeline-date">
        <span>${formatPeriode(item)}</span>
      </div>
      <div class="timeline-card">
        ${renderCardFull(item)}
      </div>
    </div>`).join('')}
  </div>`;
  container.innerHTML = html;
}

// ── Domain view ───────────────────────────────────────────────────────────────

function renderDomaineFilters(container) {
  const domaines = CV.taxonomie.domaines;
  let html = `<p class="filter-label">Filtrer</p>
    <button class="filter-btn ${!activeFilter ? 'active' : ''}" data-filter="all">Tous les domaines</button>`;

  Object.entries(domaines).forEach(([key, dom]) => {
    html += `<button class="filter-btn ${activeFilter === key ? 'active' : ''}"
      data-filter="${key}" style="--tag-color:${dom.couleur}">${dom.label}</button>`;
  });

  container.innerHTML = html;
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter === 'all' ? null : btn.dataset.filter;
      renderView('domaines');
    });
  });
}

function renderDomaines(container) {
  const items = getAllItems();
  const domaines = CV.taxonomie.domaines;
  let html = '';

  if (activeFilter) {
    const dom   = domaines[activeFilter];
    const liste = items.filter(i => i.domaines?.includes(activeFilter));
    html = `<div class="section-header" style="--accent-color:${dom.couleur}">
      <h3>${dom.label}</h3><span class="count">${liste.length} entrée${liste.length > 1 ? 's' : ''}</span>
    </div>
    <div class="cards-grid">${liste.map(i => `<div>${renderCardFull(i)}</div>`).join('')}</div>`;
  } else {
    Object.entries(domaines).forEach(([key, dom]) => {
      const liste = items.filter(i => i.domaines?.includes(key));
      if (!liste.length) return;
      html += `<div class="domaine-block">
        <div class="section-header clickable" style="--accent-color:${dom.couleur}" data-filter="${key}">
          <h3>${dom.label}</h3>
          <span class="count">${liste.length} entrée${liste.length > 1 ? 's' : ''} — cliquer pour détails</span>
        </div>
        <div class="compact-list">
          ${liste.map(i => renderCardCompact(i)).join('')}
        </div>
      </div>`;
    });
  }

  container.innerHTML = html;
  container.querySelectorAll('.section-header.clickable').forEach(el => {
    el.addEventListener('click', () => {
      activeFilter = el.dataset.filter;
      renderView('domaines');
    });
  });
}

// ── Competence view ───────────────────────────────────────────────────────────

function renderCompetenceFilters(container) {
  const groupes = groupCompetences();
  let html = `<p class="filter-label">Filtrer</p>
    <button class="filter-btn ${!activeFilter ? 'active' : ''}" data-filter="all">Toutes</button>`;

  Object.entries(groupes).forEach(([groupe, comps]) => {
    html += `<p class="filter-group-label">${groupe}</p>`;
    comps.forEach(c => {
      html += `<button class="filter-btn ${activeFilter === c.key ? 'active' : ''}"
        data-filter="${c.key}">${c.label}</button>`;
    });
  });

  container.innerHTML = html;
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter === 'all' ? null : btn.dataset.filter;
      renderView('competences');
    });
  });
}

function renderCompetences(container) {
  const items = getAllItems();
  let html = '';

  if (activeFilter) {
    const comp  = CV.taxonomie.competences[activeFilter];
    const liste = items.filter(i => i.competences?.includes(activeFilter));
    html = `<div class="section-header" style="--accent-color:#e06b3a">
      <h3>${comp.label}</h3><span class="count">${liste.length} entrée${liste.length > 1 ? 's' : ''}</span>
    </div>
    <div class="cards-grid">${liste.map(i => `<div>${renderCardFull(i)}</div>`).join('')}</div>`;
  } else {
    const groupes = groupCompetences();
    Object.entries(groupes).forEach(([groupe, comps]) => {
      html += `<div class="comp-group-block"><h3 class="comp-group-title">${groupe}</h3>`;
      comps.forEach(comp => {
        const liste = items.filter(i => i.competences?.includes(comp.key));
        if (!liste.length) return;
        html += `<div class="comp-row">
          <button class="comp-skill-btn" data-filter="${comp.key}">
            <span>${comp.label}</span>
            <span class="count-badge">${liste.length}</span>
          </button>
          <div class="comp-preview-tags">
            ${liste.map(i => `<span class="preview-chip">${i.titre}${i.organisation ? ' · ' + i.organisation : ''}</span>`).join('')}
          </div>
        </div>`;
      });
      html += '</div>';
    });
  }

  container.innerHTML = html;
  container.querySelectorAll('.comp-skill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      renderView('competences');
    });
  });
}

// ── Card renderers ────────────────────────────────────────────────────────────

function renderCardFull(item) {
  const type  = CV.taxonomie.types[item.type] || { label: item.type, couleur: '#999' };
  const org   = item.organisation || item.etablissement || '';
  const domTags = (item.domaines || []).map(d => {
    const dom = CV.taxonomie.domaines[d];
    return dom ? `<span class="tag tag-dom" style="--tag-color:${dom.couleur}">${dom.label}</span>` : '';
  }).join('');

  const points = item.points_cles?.length
    ? `<ul class="card-points">${item.points_cles.map(p => `<li>${p}</li>`).join('')}</ul>` : '';

  const techs = item.technologies?.length
    ? `<div class="tech-chips">${item.technologies.map(t => `<span class="tag tag-tech">${t}</span>`).join('')}</div>` : '';

  const placeholder = item.placeholder
    ? `<span class="badge-placeholder">À compléter</span>` : '';

  return `<div class="card">
    <div class="card-top">
      <div>
        <h3 class="card-titre">${item.titre}</h3>
        ${org ? `<p class="card-org">${org}${item.lieu ? ' · ' + item.lieu : ''}</p>` : ''}
      </div>
      <div class="card-badges">
        <span class="badge-type" style="--type-color:${type.couleur}">${type.label}</span>
        ${placeholder}
      </div>
    </div>
    ${item.description ? `<p class="card-desc">${item.description}</p>` : ''}
    ${points}
    ${techs}
    ${domTags ? `<div class="card-tags">${domTags}</div>` : ''}
  </div>`;
}

function renderCardCompact(item) {
  const type = CV.taxonomie.types[item.type] || { label: item.type, couleur: '#999' };
  const org  = item.organisation || item.etablissement || '';
  return `<div class="card-compact">
    <span class="compact-date">${formatPeriode(item)}</span>
    <div class="compact-body">
      <strong>${item.titre}</strong>
      ${org ? `<span class="compact-org">${org}</span>` : ''}
      ${item.description ? `<span class="compact-desc">${item.description}</span>` : ''}
    </div>
    <span class="badge-type sm" style="--type-color:${type.couleur}">${type.label}</span>
  </div>`;
}

// ── Profil ────────────────────────────────────────────────────────────────────

function renderProfil() {
  const p = CV.profil;
  document.title = p.titre ? `${p.nom} — ${p.titre}` : p.nom;

  document.getElementById('profile-header').innerHTML = `
    <h1>${p.nom}</h1>
    <p class="titre-pro">${p.titre || ''}${p.sousTitre ? `<br><em>${p.sousTitre}</em>` : ''}</p>`;

  const contactParts = [];
  if (p.email) contactParts.push(`<a href="mailto:${p.email}">${p.email}</a>`);
  if (p.telephone) contactParts.push(`<a href="tel:${p.telephone.replace(/\s+/g, '')}">${p.telephone}</a>`);
  if (p.adresse) contactParts.push(`<span>${p.adresse}</span>`);
  document.getElementById('contact-info').innerHTML = contactParts.join('');
}

// ── Langues ───────────────────────────────────────────────────────────────────

function renderLangues() {
  document.getElementById('langue-list').innerHTML = CV.langues.map(l => `
    <div class="langue-row">
      <span>${l.langue}</span>
      <span class="langue-niveau">${l.niveau}</span>
    </div>`).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupCompetences() {
  const groupes = {};
  Object.entries(CV.taxonomie.competences).forEach(([key, comp]) => {
    if (!groupes[comp.groupe]) groupes[comp.groupe] = [];
    groupes[comp.groupe].push({ key, ...comp });
  });
  return groupes;
}
