let currentView = 'timeline';
let activeFilter = null;

// ── Thème ─────────────────────────────────────────────────────────────────────
// Presets de couleurs sélectionnables via CV.theme.preset dans data.js, avec
// possibilité de surcharger des couleurs individuelles via CV.theme.overrides.

// Chaque preset doit rester reconnaissable même sur les zones presque
// noires/blanches (sidebar sombre, fond clair) — pas seulement sur
// l'accent, peu présent à l'écran. "mono" est volontairement sans
// aucune teinte (saturation nulle) pour trancher net avec les 3 autres.
const THEME_PRESETS = {
  ambre: { accent: '#e06b3a', bg: '#f4f2ee', sidebarBg: '#1a1a18', sidebarText: '#e2ddd5' },
  ocean: { accent: '#2563eb', bg: '#eaf1fa', sidebarBg: '#0b2540', sidebarText: '#d7e6f5' },
  foret: { accent: '#15803d', bg: '#eaf5ec', sidebarBg: '#0e2818', sidebarText: '#d7ecdd' },
  mono:  { accent: '#525252', bg: '#f2f2f2', sidebarBg: '#181818', sidebarText: '#e4e4e4' }
};

function applyTheme() {
  const t = (CV && CV.theme) || {};
  const preset = THEME_PRESETS[t.preset] || THEME_PRESETS.ambre;
  const vars = { ...preset, ...(t.overrides || {}) };
  const root = document.documentElement.style;
  if (vars.accent) root.setProperty('--accent', vars.accent);
  if (vars.bg) root.setProperty('--bg', vars.bg);
  if (vars.sidebarBg) root.setProperty('--sidebar-bg', vars.sidebarBg);
  if (vars.sidebarText) root.setProperty('--sidebar-text', vars.sidebarText);
}

document.addEventListener('DOMContentLoaded', () => {
  // Tout le démarrage est protégé par un seul try/catch : une exception
  // n'importe où ici (thème, validation, rendu) doit toujours aboutir à un
  // message d'erreur lisible, jamais à une page à moitié rendue et
  // silencieusement plantée (ex. balises vides sans explication).
  try {
    if (typeof CV !== 'undefined') applyTheme();

    const errors = validateCV();
    if (errors.length) {
      renderValidationErrors(errors);
      return;
    }

    renderProfil();
    renderLangues();
    renderView('timeline');

    document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = null;
        renderView(btn.dataset.view);
      });
    });

    const printBtn = document.getElementById('btn-print');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  } catch (e) {
    renderValidationErrors([`Erreur inattendue au chargement : ${e.message}`]);
  }
});

// La frise chronologique s'adapte en continu à la largeur de la fenêtre :
// changement de mode Gantt <-> liste au franchissement du seuil mobile, et
// ré-échelonnage de pxPerYear à chaque redimensionnement sinon (anti-rebond
// pour ne pas re-rendre à chaque pixel pendant un glisser-redimensionner).
let resizeTimer = null;
window.addEventListener('resize', () => {
  if (currentView !== 'timeline') return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderTimeline(document.getElementById('content'));
  }, 120);
});

// La frise (positionnement absolu en pixels) se prête mal à la pagination
// papier — on bascule temporairement sur la liste simple pour l'impression,
// puis on revient à l'affichage normal une fois l'aperçu fermé.
window.addEventListener('beforeprint', () => {
  if (currentView === 'timeline') {
    renderTimelineList(document.getElementById('content'), getAllItems());
  }
});
window.addEventListener('afterprint', () => {
  if (currentView === 'timeline') {
    renderTimeline(document.getElementById('content'));
  }
});

// ── Validation ───────────────────────────────────────────────────────────────
// validateCV() vit dans js/validate.js (partagé avec editor.js).

function renderValidationErrors(errors) {
  document.body.innerHTML = `
    <div class="cv-error-screen">
      <h1>data.js contient des erreurs</h1>
      <p>Le site ne peut pas s'afficher tant que ces points ne sont pas corrigés :</p>
      <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
    </div>`;
}

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
  const main    = document.getElementById('main');
  const header  = document.getElementById('view-header');
  const content = document.getElementById('content');
  const filters = document.getElementById('sidebar-filters');

  content.innerHTML = '';
  filters.innerHTML = '';
  main.classList.toggle('main-wide', view === 'timeline');

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

// ── Timeline : frise proportionnelle avec chevauchements ────────────────────
// Position verticale proportionnelle au temps ; les périodes qui se
// chevauchent sont réparties en "voies" côte à côte (comme un Gantt
// compact), pour que les cumuls (ex. deux engagements simultanés) se voient
// d'un coup d'œil plutôt que d'être noyés dans une simple liste.

const TIMELINE_PX_PER_YEAR_MIN = 90; // plancher, jamais plus serré que ça
const TIMELINE_MIN_BAR_W = 70;
const TIMELINE_LANE_H = 72;
const TIMELINE_LANE_GAP = 10;
const TIMELINE_AXIS_H = 28;
const TIMELINE_MOBILE_BREAKPOINT = 720; // en dessous : repli sur la liste simple

// Un engagement avec des sous-engagements s'agrandit pour les contenir,
// positionnés proportionnellement à leurs propres dates (même échelle
// xFromLeft que le reste de la frise) plutôt que réduits à un badge.
const TIMELINE_CHILD_HEADER_H = 32; // zone titre/période du parent quand il contient des enfants
const TIMELINE_CHILD_ROW_H = 28;    // hauteur d'une sous-voie d'enfants
const TIMELINE_CHILD_GAP = 4;

// Hauteur nécessaire pour afficher `item` sur la frise : la hauteur normale
// s'il n'a pas d'enfant, sinon assez pour contenir ses enfants directs
// (répartis en sous-voies s'ils se chevauchent entre eux). Les
// petits-enfants ne comptent pas ici : ils restent sur le badge extensible
// porté par leur propre parent (sous-bar), pour ne pas avoir à résoudre un
// empilement récursif de hauteurs.
function timelineBarHeight(item, items) {
  const kids = timelineChildrenOf(item.id, items);
  if (!kids.length) return TIMELINE_LANE_H;
  const kidPlaced = timelineAssignLanes(kids);
  const kidLaneCount = kidPlaced.reduce((m, p) => Math.max(m, p.laneCount), 1);
  const needed = TIMELINE_CHILD_HEADER_H + kidLaneCount * (TIMELINE_CHILD_ROW_H + TIMELINE_CHILD_GAP) + TIMELINE_CHILD_GAP;
  // Ne descend jamais sous la hauteur d'une barre normale, même si les
  // enfants tiennent sur une seule voie compacte.
  return Math.max(TIMELINE_LANE_H, needed);
}

// Mélange une couleur hexadécimale avec du blanc, pour un fond doux qui
// reste lisible avec du texte sombre par-dessus (la couleur pleine ne sert
// que pour la bordure/l'accent).
function tintColor(hex, whiteRatio) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c) => Math.round(c * (1 - whiteRatio) + 255 * whiteRatio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function renderTimeline(container) {
  const items = getAllItems();
  const mode = window.innerWidth < TIMELINE_MOBILE_BREAKPOINT ? 'list' : 'gantt';
  if (mode === 'list') {
    renderTimelineList(container, items);
  } else {
    renderTimelineGantt(container, items);
  }
}

// Une entrée avec "parent" est un sous-engagement d'une autre entrée
// (n'importe quelle collection) — elle n'a pas sa propre barre/voie dans la
// frise, elle apparaît encapsulée dans celle de son parent. La chaîne peut
// être aussi profonde que voulu (engagement -> sous-engagement -> tâche...),
// il n'y a pas de notion de "niveau" explicite dans le schéma.
function timelineTopLevel(items) {
  return items.filter(it => !it.parent);
}

function timelineChildrenOf(parentId, items) {
  return items.filter(it => it.parent === parentId);
}

// visited protège contre un cycle qui aurait échappé à validateCV (défense
// en profondeur — un cycle bloque normalement l'affichage bien avant ici).
function timelineChildrenTree(parentId, items, visited) {
  visited = visited || new Set();
  if (visited.has(parentId)) return '';
  visited = new Set(visited);
  visited.add(parentId);

  const kids = timelineChildrenOf(parentId, items);
  if (!kids.length) return '';
  return `<ul class="tl-children-list">${kids.map(k => {
    const org = k.organisation || k.etablissement || '';
    return `<li>
      <span class="tl-child-titre">${k.titre}</span>${org ? `<span class="tl-child-org"> — ${org}</span>` : ''}
      <span class="tl-child-period">${formatPeriode(k)}</span>
      ${timelineChildrenTree(k.id, items, visited)}
    </li>`;
  }).join('')}</ul>`;
}

function renderTimelineList(container, items) {
  const topLevel = timelineTopLevel(items);
  container.innerHTML = `<div class="timeline">${topLevel.map(item => `
    <div class="timeline-item">
      <div class="timeline-date">
        <span>${formatPeriode(item)}</span>
      </div>
      <div class="timeline-card">
        ${renderCardFull(item)}
        ${timelineChildrenTree(item.id, items)}
      </div>
    </div>`).join('')}
  </div>`;
}

function timelineBounds(items) {
  const now = new Date().getFullYear();
  let min = now;
  let max = now;
  items.forEach(it => {
    if (it.debut < min) min = it.debut;
    const end = (it.actuel || it.fin == null) ? now : it.fin;
    if (end > max) max = end;
  });
  return { min, max };
}

function timelineItemRange(item, now) {
  const start = item.debut;
  const end = (item.actuel || item.fin == null) ? now : item.fin;
  return [start, end];
}

// Regroupe les entrées en "clusters" d'éléments qui se chevauchent
// (composantes connexes dans le temps), puis attribue une voie à chacune
// par coloration gloutonne — classique algorithme d'ordonnancement
// d'intervalles. Deux entrées qui ne se chevauchent jamais, même
// indirectement, ne se disputent jamais les mêmes voies.
function timelineAssignLanes(items) {
  const now = new Date().getFullYear();
  const withRange = items
    .map(item => {
      const [s, e] = timelineItemRange(item, now);
      return { item, s, e };
    })
    .sort((a, b) => a.s - b.s || a.e - b.e);

  const clusters = [];
  let current = [];
  let currentMaxEnd = -Infinity;
  withRange.forEach(entry => {
    if (current.length && entry.s >= currentMaxEnd) {
      clusters.push(current);
      current = [];
      currentMaxEnd = -Infinity;
    }
    current.push(entry);
    currentMaxEnd = Math.max(currentMaxEnd, entry.e);
  });
  if (current.length) clusters.push(current);

  const result = [];
  clusters.forEach(cluster => {
    const laneEnds = [];
    const clusterPlaced = cluster.map(entry => {
      let lane = laneEnds.findIndex(end => entry.s >= end);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(entry.e);
      } else {
        laneEnds[lane] = entry.e;
      }
      return { ...entry, lane };
    });
    const laneCount = laneEnds.length;
    clusterPlaced.forEach(p => result.push({ ...p, laneCount }));
  });

  return result;
}

// Rend une barre de premier niveau. Si elle a des enfants, ils sont
// dessinés à l'intérieur, positionnés/dimensionnés sur la même échelle
// temporelle (xFromLeft) que le reste de la frise — pas un badge, un vrai
// sous-Gantt à une voie de profondeur.
function renderTimelineTopBar(p, items, xFromLeft, top, height) {
  const item = p.item;
  const type = CV.taxonomie.types[item.type] || { label: item.type, couleur: '#999' };
  const rawLeft = xFromLeft(p.s);
  const rawWidth = xFromLeft(p.e) - xFromLeft(p.s);
  const width = Math.max(rawWidth, TIMELINE_MIN_BAR_W);
  const left = rawLeft - (width - rawWidth) / 2;
  const org = item.organisation || item.etablissement || '';
  const bg = tintColor(type.couleur, 0.85);
  const kids = timelineChildrenOf(item.id, items);

  let inner;
  if (kids.length) {
    const kidPlaced = timelineAssignLanes(kids);
    const kidsHtml = kidPlaced.map(kp => renderTimelineChildBar(kp, items, xFromLeft, left)).join('');
    inner = `
        <div class="tl-bar-header">
          <strong class="tl-bar-titre">${item.titre}</strong>
          <span class="tl-bar-period">${formatPeriode(item)}</span>
        </div>
        <div class="tl-bar-children">${kidsHtml}</div>`;
  } else {
    inner = `
        <strong class="tl-bar-titre">${item.titre}</strong>
        ${org ? `<span class="tl-bar-org">${org}</span>` : ''}
        <span class="tl-bar-period">${formatPeriode(item)}</span>`;
  }

  return `
      <div class="tl-bar${item.actuel ? ' tl-bar-actuel' : ''}" style="left:${left}px; width:${width}px; top:${top}px; height:${height}px; --type-color:${type.couleur}; --type-bg:${bg}">
        <div class="tl-bar-card${kids.length ? ' tl-bar-card-parent' : ''}" title="${item.titre}${org ? ' — ' + org : ''} (${formatPeriode(item)})">${inner}
        </div>
      </div>`;
}

// Rend un sous-engagement à l'intérieur de la barre de son parent. S'il a
// lui-même des enfants (petits-enfants du sommet), on revient au badge
// extensible plutôt que d'imbriquer encore un niveau de sous-Gantt.
function renderTimelineChildBar(kp, items, xFromLeft, parentLeftPx) {
  const item = kp.item;
  const type = CV.taxonomie.types[item.type] || { label: item.type, couleur: '#999' };
  const rawLeft = xFromLeft(kp.s) - parentLeftPx;
  const rawWidth = xFromLeft(kp.e) - xFromLeft(kp.s);
  const width = Math.max(rawWidth, 40);
  const left = rawLeft - (width - rawWidth) / 2;
  const top = TIMELINE_CHILD_GAP + kp.lane * (TIMELINE_CHILD_ROW_H + TIMELINE_CHILD_GAP);
  const bg = tintColor(type.couleur, 0.7);
  const org = item.organisation || item.etablissement || '';
  const grandkids = timelineChildrenOf(item.id, items);
  const expandHtml = grandkids.length ? `
        <button type="button" class="tl-bar-expand tl-bar-expand-sm" data-id="${item.id}">+${grandkids.length}</button>
        <div class="tl-children-popover" id="tl-children-${item.id}" hidden>
          ${timelineChildrenTree(item.id, items)}
        </div>` : '';
  return `
        <div class="tl-child-bar${item.actuel ? ' tl-bar-actuel' : ''}" style="left:${left}px; width:${width}px; top:${top}px; height:${TIMELINE_CHILD_ROW_H}px; --type-color:${type.couleur}; --type-bg:${bg}" title="${item.titre}${org ? ' — ' + org : ''} (${formatPeriode(item)})">
          <span class="tl-child-bar-titre">${item.titre}</span>
          ${expandHtml}
        </div>`;
}

function renderTimelineGantt(container, items) {
  const topLevel = timelineTopLevel(items);
  if (!topLevel.length) {
    container.innerHTML = '<p class="hint">Aucune entrée.</p>';
    return;
  }
  const { min, max } = timelineBounds(topLevel);
  const now = new Date().getFullYear();
  const yearSpan = Math.max(max - min, 1);
  // Étire la frise pour remplir la largeur disponible plutôt que de laisser
  // du vide — ne descend jamais sous le plancher (lisibilité), mais grandit
  // librement sur un grand écran.
  const available = container.clientWidth || 0;
  const pxPerYear = Math.max(TIMELINE_PX_PER_YEAR_MIN, (available - TIMELINE_MIN_BAR_W) / yearSpan);
  const xFromLeft = (year) => (year - min) * pxPerYear;
  const totalWidth = Math.max(xFromLeft(max) + TIMELINE_MIN_BAR_W / 2 + 40, available);

  const placed = timelineAssignLanes(topLevel);
  const maxLaneIndex = placed.reduce((m, p) => Math.max(m, p.lane), 0);
  // Une voie qui contient un engagement avec des sous-engagements doit être
  // plus haute — toutes les barres de cette voie partagent la même hauteur
  // de ligne (comme dans un Gantt classique), même celles sans enfant.
  const laneHeights = [];
  for (let l = 0; l <= maxLaneIndex; l++) {
    const inLane = placed.filter(p => p.lane === l);
    laneHeights[l] = inLane.length ? Math.max(...inLane.map(p => timelineBarHeight(p.item, items))) : TIMELINE_LANE_H;
  }
  const laneTop = [];
  let cursor = TIMELINE_LANE_GAP;
  for (let l = 0; l <= maxLaneIndex; l++) {
    laneTop[l] = cursor;
    cursor += laneHeights[l] + TIMELINE_LANE_GAP;
  }
  const totalHeight = TIMELINE_AXIS_H + cursor;

  const years = [];
  for (let y = min; y <= max; y++) years.push(y);
  const axisHtml = years.map(y => `
    <div class="tl-axis-col${y === now ? ' tl-axis-col-now' : ''}" style="left:${xFromLeft(y)}px">
      <span class="tl-axis-year">${y === now ? 'auj.' : y}</span>
      <span class="tl-axis-line"></span>
    </div>`).join('');

  const barsHtml = placed.map(p => renderTimelineTopBar(p, items, xFromLeft, laneTop[p.lane], laneHeights[p.lane])).join('');

  container.innerHTML = `
    <div class="tl-gantt-wrap">
      <div class="tl-gantt" style="width:${totalWidth}px; height:${totalHeight}px">
        <div class="tl-gantt-axis">${axisHtml}</div>
        <div class="tl-gantt-bars" style="top:${TIMELINE_AXIS_H}px">${barsHtml}</div>
      </div>
    </div>`;

  container.querySelectorAll('.tl-bar-expand').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const popover = document.getElementById(`tl-children-${btn.dataset.id}`);
      if (popover) popover.hidden = !popover.hidden;
    });
  });
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

  const photo = p.photo
    ? `<img class="profile-photo" src="${p.photo}" alt="${p.nom}">`
    : '';

  const lieu = [p.ville, p.pays].filter(Boolean).join(', ');

  document.getElementById('profile-header').innerHTML = `
    ${photo}
    <h1>${p.nom}</h1>
    <p class="titre-pro">${p.titre || ''}${p.sousTitre ? `<br><em>${p.sousTitre}</em>` : ''}</p>
    ${lieu ? `<p class="lieu">${lieu}</p>` : ''}`;

  renderContact();
}

// ── Contact ───────────────────────────────────────────────────────────────────
// Jamais de téléphone/email affiché en clair par défaut — voir CV.contact
// dans data.js pour les deux mécanismes disponibles (mailto / formulaire).

function renderContact() {
  const c = CV.contact || {};
  const el = document.getElementById('contact-info');

  if (c.mode === 'form') {
    if (!c.formAction) {
      el.innerHTML = `<p class="contact-warning">CV.contact.formAction n'est pas configuré (voir README).</p>`;
      return;
    }
    el.innerHTML = `
      <form class="contact-form" action="${c.formAction}" method="POST">
        <input type="text" name="name" placeholder="Votre nom" required>
        <input type="email" name="_replyto" placeholder="Votre email" required>
        <textarea name="message" placeholder="Votre message" rows="3" required></textarea>
        <button type="submit">Envoyer</button>
      </form>`;
    return;
  }

  el.innerHTML = c.email ? `<a href="mailto:${c.email}">${c.email}</a>` : '';
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
