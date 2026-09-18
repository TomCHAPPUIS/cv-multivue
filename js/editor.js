// ─────────────────────────────────────────────────────────────────────────
// editor.js — formulaire de saisie pour éviter d'éditer js/data.js à la
// main. Ne modifie AUCUN fichier disque (site 100% statique, pas de
// backend) : produit un data.js à télécharger et remplacer soi-même.
// ─────────────────────────────────────────────────────────────────────────

let state = null;

// ── Utilitaires ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  const base = String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'entree';
}

function uniqueId(base, usedIds) {
  let id = base, n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);
  return id;
}

function objToArr(obj) {
  return Object.entries(obj || {}).map(([id, v]) => ({ id, ...v }));
}
function arrToObj(arr) {
  const obj = {};
  (arr || []).forEach(({ id, ...rest }) => { obj[id] = rest; });
  return obj;
}

// ── État ─────────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'cvEditorDraft';

function defaultState() {
  return {
    theme: { preset: 'ambre', overrides: {} },
    display: { masquerTypesLieu: [] },
    profil: { nom: '', titre: '', sousTitre: '', photo: '', ville: '', pays: '', bio: '' },
    contact: { mode: 'mailto', email: '', formAction: '' },
    taxonomie: { domaines: {}, types: {}, competences: {} },
    glossaire: {},
    experiences: [], formations: [], projets: [], langues: []
  };
}

// Convertit un objet CV "au format data.js" (taxonomie/glossaire indexés par
// id) vers la forme interne de l'éditeur (tableaux, pour add/remove/CRUD
// facile). Point d'entrée commun pour : les données du site (CV), un
// brouillon relu depuis localStorage, ou un fichier importé.
function normalizeState(src) {
  src = src || {};
  return {
    theme: src.theme || { preset: 'ambre', overrides: {} },
    display: { masquerTypesLieu: (src.display && src.display.masquerTypesLieu) || [] },
    profil: src.profil || { nom: '', titre: '', sousTitre: '', photo: '', ville: '', pays: '', bio: '' },
    contact: src.contact || { mode: 'mailto', email: '', formAction: '' },
    taxonomie: {
      domaines: objToArr(src.taxonomie && src.taxonomie.domaines),
      types: objToArr(src.taxonomie && src.taxonomie.types),
      competences: objToArr(src.taxonomie && src.taxonomie.competences)
    },
    glossaire: objToArr(src.glossaire),
    experiences: src.experiences || [],
    formations: src.formations || [],
    projets: src.projets || [],
    langues: src.langues || []
  };
}

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(toOutputCV())); } catch (e) { /* stockage indisponible, tant pis */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
}

// Priorité au brouillon sauvegardé dans ce navigateur (pour ne jamais perdre
// une saisie en cours entre deux visites) ; à défaut, les données publiées
// sur ce site (CV, depuis data.js) ; à défaut, un état vide.
function loadInitialState() {
  const draft = readDraft();
  const src = draft || ((typeof CV !== 'undefined' && CV) ? JSON.parse(JSON.stringify(CV)) : defaultState());
  return normalizeState(src);
}

function loadFromPublished() {
  const src = (typeof CV !== 'undefined' && CV) ? JSON.parse(JSON.stringify(CV)) : defaultState();
  return normalizeState(src);
}

function importFromText(text) {
  try {
    const imported = new Function(`${text}\nreturn CV;`)();
    if (!imported || typeof imported !== 'object') throw new Error("aucun objet CV trouvé dans le fichier.");
    state = normalizeState(imported);
    rebuildAllSections();
    updateOutput();
  } catch (e) {
    alert("Impossible d'importer ce fichier : " + e.message);
  }
}

function toOutputCV() {
  return {
    theme: state.theme,
    display: state.display,
    profil: state.profil,
    contact: state.contact,
    taxonomie: {
      domaines: arrToObj(state.taxonomie.domaines),
      types: arrToObj(state.taxonomie.types),
      competences: arrToObj(state.taxonomie.competences)
    },
    glossaire: arrToObj(state.glossaire),
    experiences: state.experiences,
    formations: state.formations,
    projets: state.projets,
    langues: state.langues
  };
}

function generateDataJs() {
  return `// Généré par editor.html — voir README.md pour le schéma complet.\nconst CV = ${JSON.stringify(toOutputCV(), null, 2)};\n`;
}

function allTaxoIds() {
  const s = new Set();
  ['domaines', 'types', 'competences'].forEach(k => state.taxonomie[k].forEach(t => s.add(t.id)));
  return s;
}

function allEntryIds() {
  const s = new Set();
  ['experiences', 'formations', 'projets'].forEach(k => state[k].forEach(e => e.id && s.add(e.id)));
  return s;
}

// Toutes les entrées (3 collections confondues), pour le sélecteur "Sous-
// engagement de" — un parent peut se trouver dans n'importe quelle
// collection.
function allEntriesFlat() {
  const out = [];
  ['experiences', 'formations', 'projets'].forEach(k => state[k].forEach(e => out.push(e)));
  return out;
}

// ── Sortie live (validation + code généré) ─────────────────────────────────

function updateOutput() {
  saveDraft();
  document.getElementById('output').value = generateDataJs();

  const errors = validateCV(toOutputCV());
  const banner = document.getElementById('validation-banner');
  if (!errors.length) {
    banner.innerHTML = '<p class="ok">✓ Données valides — prêtes à télécharger.</p>';
  } else {
    banner.innerHTML =
      `<p class="warn">${errors.length} point${errors.length > 1 ? 's' : ''} à corriger :</p>` +
      `<ul>${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
  }
}

// ── Thème ────────────────────────────────────────────────────────────────────

// Types de lieu réellement utilisés dans les entrées actuelles (le champ
// "type" d'un lieu est du texte libre, pas une taxonomie fermée — cette
// liste sert uniquement à proposer les bons réglages d'affichage/masquage.
function allLieuTypes() {
  const s = new Set();
  ['experiences', 'formations', 'projets'].forEach(k => {
    state[k].forEach(item => (item.lieu || []).forEach(l => { if (l.type) s.add(l.type); }));
  });
  return [...s].sort();
}

function buildThemeSection() {
  const c = document.getElementById('section-theme');
  const presets = ['ambre', 'ocean', 'foret', 'mono'];
  const lieuTypes = allLieuTypes();
  c.innerHTML = `
    <h2>Apparence</h2>
    <label class="field">
      <span>Palette</span>
      <select id="theme-preset">
        ${presets.map(p => `<option value="${p}" ${state.theme.preset === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    </label>
    <p class="hint">Pour une couleur d'accent personnalisée par-dessus la palette, éditez <code>overrides</code> directement dans le fichier généré — voir README.</p>
    ${lieuTypes.length ? `
      <div class="field">
        <span>Types de lieu à afficher</span>
        <p class="hint">Utile par exemple si toutes vos expériences sont dans la même ville : décochez "ville" pour ne pas la répéter partout, en gardant "institution" affiché.</p>
        ${lieuTypes.map(t => `
          <label class="field-checkbox"><input type="checkbox" class="display-lieu-type" data-type="${escapeHtml(t)}" ${state.display.masquerTypesLieu.includes(t) ? '' : 'checked'}><span>${escapeHtml(t)}</span></label>`).join('')}
      </div>` : ''}`;

  document.getElementById('theme-preset').addEventListener('change', (e) => {
    state.theme.preset = e.target.value;
    updateOutput();
  });
  c.querySelectorAll('.display-lieu-type').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const t = e.target.dataset.type;
      const hidden = state.display.masquerTypesLieu;
      const idx = hidden.indexOf(t);
      if (e.target.checked && idx !== -1) hidden.splice(idx, 1);
      if (!e.target.checked && idx === -1) hidden.push(t);
      updateOutput();
    });
  });
}

// ── Profil ───────────────────────────────────────────────────────────────────

function textField(id, label, value, placeholder = '') {
  return `<label class="field"><span>${label}</span><input type="text" id="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"></label>`;
}

function textareaField(id, label, value, placeholder = '') {
  return `<label class="field"><span>${label}</span><textarea id="${id}" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></label>`;
}

const PAYS_LIST = [
  'Afrique du Sud', 'Algérie', 'Allemagne', 'Argentine', 'Australie', 'Autriche',
  'Belgique', 'Bénin', 'Brésil', 'Bulgarie', 'Burkina Faso', 'Cameroun', 'Canada',
  'Chili', 'Chine', 'Colombie', "Côte d'Ivoire", 'Croatie', 'Danemark', 'Égypte',
  'Émirats arabes unis', 'Espagne', 'États-Unis', 'Éthiopie', 'Finlande', 'France',
  'Gabon', 'Ghana', 'Grèce', 'Hongrie', 'Inde', 'Indonésie', 'Irlande', 'Islande',
  'Israël', 'Italie', 'Japon', 'Kenya', 'Liban', 'Luxembourg', 'Madagascar',
  'Malaisie', 'Mali', 'Maroc', 'Mexique', 'Niger', 'Nigéria', 'Norvège',
  'Nouvelle-Zélande', 'Pakistan', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne',
  'Portugal', 'République démocratique du Congo', 'République tchèque', 'Roumanie',
  'Royaume-Uni', 'Russie', 'Rwanda', 'Arabie saoudite', 'Sénégal', 'Serbie',
  'Singapour', 'Slovaquie', 'Slovénie', 'Suède', 'Suisse', 'Thaïlande', 'Togo',
  'Tunisie', 'Turquie', 'Ukraine', 'Vietnam'
];

function buildProfilSection() {
  const c = document.getElementById('section-profil');
  const p = state.profil;
  const paysConnu = PAYS_LIST.includes(p.pays);
  c.innerHTML = `
    <h2>Identité publique</h2>
    <p class="hint">Ce que vous accepteriez de voir sur un réseau social. Aucun téléphone/email ici — voir la section Contact.</p>
    ${textField('p-nom', 'Nom', p.nom)}
    ${textField('p-titre', 'Titre', p.titre)}
    ${textField('p-soustitre', 'Sous-titre', p.sousTitre)}

    <div class="field">
      <span>Photo</span>
      <div class="photo-picker">
        <img class="photo-preview" id="p-photo-preview" src="${escapeHtml(p.photo)}" alt="" ${p.photo ? '' : 'hidden'}>
        <div class="photo-picker-controls">
          <input type="file" id="p-photo-file" accept="image/*">
          <input type="text" id="p-photo" value="${escapeHtml(p.photo)}" placeholder="images/moi.jpg ou URL, ou choisissez un fichier">
        </div>
      </div>
      <p class="hint">Un fichier choisi ici est intégré directement dans data.js (pratique, mais alourdit le fichier — préférez une photo déjà compressée). Vous pouvez sinon coller une URL/chemin si l'image est hébergée ailleurs.</p>
    </div>

    ${textField('p-ville', 'Ville', p.ville)}
    <label class="field">
      <span>Pays</span>
      <select id="p-pays">
        <option value="">—</option>
        ${PAYS_LIST.map(pays => `<option value="${escapeHtml(pays)}" ${p.pays === pays ? 'selected' : ''}>${escapeHtml(pays)}</option>`).join('')}
        <option value="__autre__" ${p.pays && !paysConnu ? 'selected' : ''}>Autre…</option>
      </select>
    </label>
    <div id="p-pays-autre-wrap">${(p.pays && !paysConnu) ? textField('p-pays-autre', 'Précisez le pays', p.pays) : ''}</div>

    ${textareaField('p-bio', 'Bio courte', p.bio)}`;

  const bind = (id, key) => document.getElementById(id).addEventListener('input', (e) => {
    state.profil[key] = e.target.value;
    updateOutput();
  });
  bind('p-nom', 'nom');
  bind('p-titre', 'titre');
  bind('p-soustitre', 'sousTitre');
  bind('p-ville', 'ville');
  bind('p-bio', 'bio');

  const preview = document.getElementById('p-photo-preview');
  const setPhoto = (value) => {
    state.profil.photo = value;
    document.getElementById('p-photo').value = value;
    if (value) { preview.src = value; preview.hidden = false; } else { preview.hidden = true; }
    updateOutput();
  };
  document.getElementById('p-photo').addEventListener('input', (e) => setPhoto(e.target.value));
  document.getElementById('p-photo-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  });

  const paysAutreWrap = document.getElementById('p-pays-autre-wrap');
  document.getElementById('p-pays').addEventListener('change', (e) => {
    if (e.target.value === '__autre__') {
      paysAutreWrap.innerHTML = textField('p-pays-autre', 'Précisez le pays', '');
      document.getElementById('p-pays-autre').addEventListener('input', (ev) => {
        state.profil.pays = ev.target.value;
        updateOutput();
      });
      state.profil.pays = '';
    } else {
      paysAutreWrap.innerHTML = '';
      state.profil.pays = e.target.value;
    }
    updateOutput();
  });
  const autreInput = document.getElementById('p-pays-autre');
  if (autreInput) autreInput.addEventListener('input', (e) => {
    state.profil.pays = e.target.value;
    updateOutput();
  });
}

// ── Contact ──────────────────────────────────────────────────────────────────

function buildContactSection() {
  const c = document.getElementById('section-contact');
  const ct = state.contact;
  c.innerHTML = `
    <h2>Contact</h2>
    <p class="hint">Jamais affiché en clair dans le code de la page en mode formulaire — voir README pour le détail du compromis.</p>
    <label class="field">
      <span>Mode</span>
      <select id="c-mode">
        <option value="mailto" ${ct.mode === 'mailto' ? 'selected' : ''}>mailto (simple, adresse visible dans le code)</option>
        <option value="form" ${ct.mode === 'form' ? 'selected' : ''}>formulaire (service tiers, adresse cachée)</option>
      </select>
    </label>
    <div id="c-fields"></div>`;

  const renderFields = () => {
    const fc = document.getElementById('c-fields');
    if (state.contact.mode === 'form') {
      fc.innerHTML = textField('c-formaction', 'URL du formulaire (Formspree, Web3Forms...)', ct.formAction, 'https://formspree.io/f/xxxxxxxx');
      document.getElementById('c-formaction').addEventListener('input', (e) => {
        state.contact.formAction = e.target.value;
        updateOutput();
      });
    } else {
      fc.innerHTML = textField('c-email', 'Email', ct.email);
      document.getElementById('c-email').addEventListener('input', (e) => {
        state.contact.email = e.target.value;
        updateOutput();
      });
    }
  };
  renderFields();

  document.getElementById('c-mode').addEventListener('change', (e) => {
    state.contact.mode = e.target.value;
    renderFields();
    updateOutput();
  });
}

// ── Taxonomie ────────────────────────────────────────────────────────────────

const TAXO_LABELS = { domaines: 'Domaines', types: 'Types', competences: 'Compétences' };

function buildTaxonomieSection() {
  const c = document.getElementById('section-taxonomie');
  c.innerHTML = `
    <h2>Taxonomie</h2>
    <p class="hint">Vos propres catégories, utilisées comme filtres dans les cases à cocher des expériences/formations/projets ci-dessous. Pour renommer une catégorie sans perdre les entrées qui l'utilisent, changez juste son libellé (la référence interne reste stable) ; pour la remplacer entièrement, supprimez-la et recréez-en une.</p>
    ${Object.keys(TAXO_LABELS).map(kind => `
      <div class="taxo-block">
        <h3>${TAXO_LABELS[kind]}</h3>
        <div id="taxo-list-${kind}"></div>
        <button type="button" class="btn-add" id="taxo-add-${kind}">+ Ajouter</button>
      </div>`).join('')}`;

  Object.keys(TAXO_LABELS).forEach(kind => {
    renderTaxoList(kind);
    document.getElementById(`taxo-add-${kind}`).addEventListener('click', () => {
      const id = uniqueId(slugify('nouveau'), allTaxoIds());
      const entry = kind === 'competences'
        ? { id, label: 'Nouvelle compétence', groupe: 'Management' }
        : { id, label: 'Nouveau', couleur: '#888888' };
      state.taxonomie[kind].push(entry);
      renderTaxoList(kind);
      refreshEntrySections();
      updateOutput();
    });
  });
}

function allGlossaireIds() {
  return new Set(state.glossaire.map(g => g.id));
}

function buildGlossaireSection() {
  const c = document.getElementById('section-glossaire');
  c.innerHTML = `
    <h2>Glossaire</h2>
    <p class="hint">Petites définitions pour les termes qui le méritent (un lieu, une institution...) — n'apparaissent nulle part dans la navigation du site, juste accessibles en cliquant sur le terme une fois référencé (ex. depuis un "Lieu" d'une expérience, section suivante).</p>
    <div id="glossaire-list"></div>
    <button type="button" class="btn-add" id="glossaire-add">+ Ajouter un terme</button>`;

  renderGlossaireList();
  document.getElementById('glossaire-add').addEventListener('click', () => {
    const id = uniqueId(slugify('terme'), allGlossaireIds());
    state.glossaire.push({ id, terme: 'Nouveau terme', definition: '' });
    renderGlossaireList();
    refreshEntrySections();
    updateOutput();
  });
}

function renderGlossaireList() {
  const list = state.glossaire;
  const el = document.getElementById('glossaire-list');
  el.innerHTML = list.map((g, i) => `
    <div class="taxo-row">
      <input type="text" data-i="${i}" data-f="terme" value="${escapeHtml(g.terme)}" placeholder="Terme">
      <input type="text" data-i="${i}" data-f="definition" value="${escapeHtml(g.definition)}" placeholder="Définition">
      <button type="button" class="btn-remove" data-i="${i}">✕</button>
    </div>`).join('') || '<p class="hint">Aucun terme.</p>';

  el.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const i = Number(e.target.dataset.i);
      const f = e.target.dataset.f;
      state.glossaire[i][f] = e.target.value;
      updateOutput();
    });
  });
  el.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.target.dataset.i);
      state.glossaire.splice(i, 1);
      renderGlossaireList();
      refreshEntrySections();
      updateOutput();
    });
  });
}

function renderTaxoList(kind) {
  const list = state.taxonomie[kind];
  const el = document.getElementById(`taxo-list-${kind}`);
  el.innerHTML = list.map((t, i) => `
    <div class="taxo-row">
      <input type="text" data-i="${i}" data-f="label" value="${escapeHtml(t.label)}" placeholder="Libellé">
      ${kind === 'competences'
        ? `<input type="text" data-i="${i}" data-f="groupe" value="${escapeHtml(t.groupe)}" placeholder="Groupe">`
        : `<input type="color" data-i="${i}" data-f="couleur" value="${escapeHtml(t.couleur || '#888888')}">`}
      <button type="button" class="btn-remove" data-i="${i}">✕</button>
    </div>`).join('') || '<p class="hint">Aucune entrée.</p>';

  el.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const i = Number(e.target.dataset.i);
      const f = e.target.dataset.f;
      state.taxonomie[kind][i][f] = e.target.value;
      updateOutput();
    });
  });
  el.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.target.dataset.i);
      state.taxonomie[kind].splice(i, 1);
      renderTaxoList(kind);
      refreshEntrySections();
      updateOutput();
    });
  });
}

function refreshEntrySections() {
  buildEntriesSection('experiences');
  buildEntriesSection('formations');
  buildEntriesSection('projets');
}

// ── Expériences / Formations / Projets ──────────────────────────────────────

const ENTRY_LABELS = { experiences: 'Expériences', formations: 'Formations', projets: 'Projets' };
const ENTRY_TYPE_DEFAULT = { experiences: 'emploi', formations: 'formation', projets: 'projet' };

function newEntry(collection) {
  return {
    id: '', titre: '', organisation: '', lieu: '',
    debut: new Date().getFullYear(), fin: null, actuel: true,
    type: ENTRY_TYPE_DEFAULT[collection] || '',
    domaines: [], competences: [], description: '', points_cles: [],
    ...(collection === 'formations' ? { etablissement: '' } : {}),
    ...(collection === 'projets' ? { technologies: [], placeholder: true } : {})
  };
}

function buildEntriesSection(collection) {
  const c = document.getElementById(`section-${collection}`);
  c.innerHTML = `
    <h2>${ENTRY_LABELS[collection]}</h2>
    <div id="entries-list-${collection}"></div>
    <button type="button" class="btn-add" id="entries-add-${collection}">+ Ajouter</button>`;

  renderEntryCards(collection);
  document.getElementById(`entries-add-${collection}`).addEventListener('click', () => {
    state[collection].push(newEntry(collection));
    renderEntryCards(collection);
    updateOutput();
  });
}

function lieuRowHtml(li, l) {
  const glossOptions = state.glossaire.map(g =>
    `<option value="${escapeHtml(g.id)}" ${l.glossaire === g.id ? 'selected' : ''}>${escapeHtml(g.terme)}</option>`
  ).join('');
  return `<div class="taxo-row">
    <input type="text" data-li="${li}" data-f="type" value="${escapeHtml(l.type || '')}" placeholder="Type (ville, institution...)">
    <input type="text" data-li="${li}" data-f="valeur" value="${escapeHtml(l.valeur || '')}" placeholder="Valeur">
    <select data-li="${li}" data-f="glossaire">
      <option value="">Sans définition</option>
      ${glossOptions}
    </select>
    <button type="button" class="btn-remove" data-li="${li}">✕</button>
  </div>`;
}

// Rend (et recâble) les lignes "Lieu" d'une entrée précise — appelée au
// premier rendu de la carte, puis à chaque ajout/suppression de ligne.
function renderLieuRows(collection, i) {
  const item = state[collection][i];
  const lieux = item.lieu || (item.lieu = []);
  const wrap = document.getElementById(`e-${collection}-${i}-lieu-rows`);
  if (!wrap) return;
  wrap.innerHTML = lieux.map((l, li) => lieuRowHtml(li, l)).join('') || '<p class="hint">Aucun lieu ajouté.</p>';

  wrap.querySelectorAll('input, select').forEach(inp => {
    const evt = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(evt, (e) => {
      const li = Number(e.target.dataset.li);
      const f = e.target.dataset.f;
      lieux[li][f] = e.target.value || undefined;
      // Les réglages "types de lieu à afficher" (section Apparence)
      // dépendent des types réellement utilisés — on les tient à jour.
      if (f === 'type') buildThemeSection();
      updateOutput();
    });
  });
  wrap.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const li = Number(e.target.dataset.li);
      lieux.splice(li, 1);
      renderLieuRows(collection, i);
      buildThemeSection();
      updateOutput();
    });
  });
}

function renderEntryCards(collection) {
  const list = state[collection];
  const el = document.getElementById(`entries-list-${collection}`);
  const domaines = state.taxonomie.domaines;
  const types = state.taxonomie.types;
  const competences = state.taxonomie.competences;

  el.innerHTML = list.map((item, i) => `
    <div class="entry-card">
      <div class="entry-card-head">
        <strong>${escapeHtml(item.titre) || `${ENTRY_LABELS[collection].slice(0, -1)} #${i + 1}`}</strong>
        <button type="button" class="btn-remove" data-i="${i}">✕ Supprimer</button>
      </div>
      ${textField(`e-${collection}-${i}-titre`, 'Titre', item.titre)}
      ${textField(`e-${collection}-${i}-org`, collection === 'formations' ? 'Département / faculté' : 'Organisation', item.organisation)}
      ${collection === 'formations' ? textField(`e-${collection}-${i}-etab`, 'Établissement', item.etablissement || '') : ''}
      <div class="field">
        <span>Lieu</span>
        <div id="e-${collection}-${i}-lieu-rows"></div>
        <button type="button" class="btn-add" id="e-${collection}-${i}-lieu-add">+ Ajouter un lieu</button>
      </div>
      <div class="field-row">
        <label class="field"><span>Début</span><input type="number" id="e-${collection}-${i}-debut" value="${item.debut ?? ''}"></label>
        <label class="field"><span>Fin</span><input type="number" id="e-${collection}-${i}-fin" value="${item.fin ?? ''}" ${item.actuel ? 'disabled' : ''}></label>
        <label class="field field-checkbox"><input type="checkbox" id="e-${collection}-${i}-actuel" ${item.actuel ? 'checked' : ''}><span>En cours</span></label>
      </div>
      <label class="field">
        <span>Type</span>
        <select id="e-${collection}-${i}-type">
          <option value="">—</option>
          ${types.map(t => `<option value="${escapeHtml(t.id)}" ${item.type === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>Sous-engagement de</span>
        <select id="e-${collection}-${i}-parent">
          <option value="">— aucun (engagement principal) —</option>
          ${allEntriesFlat().filter(e => e.id !== item.id).map(e =>
            `<option value="${escapeHtml(e.id)}" ${item.parent === e.id ? 'selected' : ''}>${escapeHtml(e.titre) || '(sans titre)'}</option>`
          ).join('')}
        </select>
      </label>
      <fieldset class="chip-group">
        <legend>Domaines</legend>
        ${domaines.map(d => `
          <label class="chip"><input type="checkbox" data-key="${escapeHtml(d.id)}" ${item.domaines.includes(d.id) ? 'checked' : ''} class="e-${collection}-${i}-dom">${escapeHtml(d.label)}</label>`).join('') || '<span class="hint">Aucun domaine défini.</span>'}
      </fieldset>
      <fieldset class="chip-group">
        <legend>Compétences</legend>
        ${competences.map(cp => `
          <label class="chip"><input type="checkbox" data-key="${escapeHtml(cp.id)}" ${item.competences.includes(cp.id) ? 'checked' : ''} class="e-${collection}-${i}-comp">${escapeHtml(cp.label)}</label>`).join('') || '<span class="hint">Aucune compétence définie.</span>'}
      </fieldset>
      ${textareaField(`e-${collection}-${i}-desc`, 'Description (une phrase)', item.description)}
      ${textareaField(`e-${collection}-${i}-points`, 'Points clés (un par ligne)', (item.points_cles || []).join('\n'))}
      ${collection === 'projets' ? textField(`e-${collection}-${i}-tech`, 'Technologies (séparées par des virgules)', (item.technologies || []).join(', ')) : ''}
      ${collection === 'projets' ? `<label class="field field-checkbox"><input type="checkbox" id="e-${collection}-${i}-placeholder" ${item.placeholder ? 'checked' : ''}><span>Marquer "À compléter"</span></label>` : ''}
    </div>`).join('') || '<p class="hint">Aucune entrée pour l\'instant.</p>';

  list.forEach((item, i) => {
    const bindText = (suffix, cb) => {
      const node = document.getElementById(`e-${collection}-${i}-${suffix}`);
      if (node) node.addEventListener('input', (e) => { cb(e.target.value); updateOutput(); });
    };
    bindText('titre', v => { item.titre = v; assignAutoId(item); refreshEntryTitleDom(collection, i); });
    bindText('org', v => { item.organisation = v; });
    if (collection === 'formations') bindText('etab', v => { item.etablissement = v; });
    bindText('debut', v => { item.debut = v ? Number(v) : null; });
    bindText('fin', v => { item.fin = v ? Number(v) : null; });
    bindText('desc', v => { item.description = v; });
    bindText('points', v => { item.points_cles = v.split('\n').map(s => s.trim()).filter(Boolean); });
    if (collection === 'projets') bindText('tech', v => { item.technologies = v.split(',').map(s => s.trim()).filter(Boolean); });

    const actuelBox = document.getElementById(`e-${collection}-${i}-actuel`);
    if (actuelBox) actuelBox.addEventListener('change', (e) => {
      item.actuel = e.target.checked;
      const finInput = document.getElementById(`e-${collection}-${i}-fin`);
      if (finInput) finInput.disabled = item.actuel;
      if (item.actuel) item.fin = null;
      updateOutput();
    });

    const typeSel = document.getElementById(`e-${collection}-${i}-type`);
    if (typeSel) typeSel.addEventListener('change', (e) => { item.type = e.target.value; updateOutput(); });

    const parentSel = document.getElementById(`e-${collection}-${i}-parent`);
    if (parentSel) parentSel.addEventListener('change', (e) => { item.parent = e.target.value || undefined; updateOutput(); });

    renderLieuRows(collection, i);
    const lieuAddBtn = document.getElementById(`e-${collection}-${i}-lieu-add`);
    if (lieuAddBtn) lieuAddBtn.addEventListener('click', () => {
      (item.lieu || (item.lieu = [])).push({ type: '', valeur: '' });
      renderLieuRows(collection, i);
      updateOutput();
    });

    document.querySelectorAll(`.e-${collection}-${i}-dom`).forEach(cb => {
      cb.addEventListener('change', (e) => {
        toggleInArray(item.domaines, e.target.dataset.key, e.target.checked);
        updateOutput();
      });
    });
    document.querySelectorAll(`.e-${collection}-${i}-comp`).forEach(cb => {
      cb.addEventListener('change', (e) => {
        toggleInArray(item.competences, e.target.dataset.key, e.target.checked);
        updateOutput();
      });
    });

    if (collection === 'projets') {
      const ph = document.getElementById(`e-${collection}-${i}-placeholder`);
      if (ph) ph.addEventListener('change', (e) => { item.placeholder = e.target.checked; updateOutput(); });
    }
  });

  el.querySelectorAll('.entry-card-head .btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.target.dataset.i);
      state[collection].splice(i, 1);
      renderEntryCards(collection);
      updateOutput();
    });
  });

  // Attribue un id automatique aux seules entrées qui n'en ont pas encore
  // (ex. import de data.js malformé) — ne touche jamais un id déjà présent,
  // sinon rouvrir l'éditeur renommerait silencieusement toutes les entrées.
  list.forEach(item => { if (!item.id && item.titre) assignAutoId(item); });

  function refreshEntryTitleDom(coll, idx) {
    const card = el.children[idx];
    if (!card) return;
    const item = state[coll][idx];
    const strong = card.querySelector('.entry-card-head strong');
    if (strong) strong.textContent = item.titre || `${ENTRY_LABELS[coll].slice(0, -1)} #${idx + 1}`;
  }
}

function toggleInArray(arr, value, add) {
  const i = arr.indexOf(value);
  if (add && i === -1) arr.push(value);
  if (!add && i !== -1) arr.splice(i, 1);
}

function assignAutoId(item) {
  if (item.titre) {
    item.id = uniqueId(slugify(item.titre), new Set([...allEntryIds()].filter(x => x !== item.id)));
  }
}

// ── Langues ──────────────────────────────────────────────────────────────────

function buildLanguesSection() {
  const c = document.getElementById('section-langues');
  c.innerHTML = `
    <h2>Langues</h2>
    <div id="langues-list"></div>
    <button type="button" class="btn-add" id="langues-add">+ Ajouter</button>`;
  renderLanguesList();
  document.getElementById('langues-add').addEventListener('click', () => {
    state.langues.push({ langue: '', niveau: '' });
    renderLanguesList();
    updateOutput();
  });
}

function renderLanguesList() {
  const el = document.getElementById('langues-list');
  el.innerHTML = state.langues.map((l, i) => `
    <div class="taxo-row">
      <input type="text" data-i="${i}" data-f="langue" value="${escapeHtml(l.langue)}" placeholder="Langue">
      <input type="text" data-i="${i}" data-f="niveau" value="${escapeHtml(l.niveau)}" placeholder="Niveau">
      <button type="button" class="btn-remove" data-i="${i}">✕</button>
    </div>`).join('') || '<p class="hint">Aucune langue.</p>';

  el.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const i = Number(e.target.dataset.i);
      const f = e.target.dataset.f;
      state.langues[i][f] = e.target.value;
      updateOutput();
    });
  });
  el.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.target.dataset.i);
      state.langues.splice(i, 1);
      renderLanguesList();
      updateOutput();
    });
  });
}

// ── Actions globales ─────────────────────────────────────────────────────────

function downloadDataJs() {
  const blob = new Blob([generateDataJs()], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.js';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPreview() {
  // Le brouillon est déjà sauvegardé en continu dans localStorage
  // (saveDraft(), appelé par updateOutput() à chaque changement) —
  // preview.html le relit directement, pas besoin de transmission
  // séparée entre onglets.
  saveDraft();
  window.open('preview.html', '_blank');
}

// ── Init ─────────────────────────────────────────────────────────────────────

function rebuildAllSections() {
  buildThemeSection();
  buildProfilSection();
  buildContactSection();
  buildTaxonomieSection();
  buildGlossaireSection();
  buildEntriesSection('experiences');
  buildEntriesSection('formations');
  buildEntriesSection('projets');
  buildLanguesSection();
}

document.addEventListener('DOMContentLoaded', () => {
  state = loadInitialState();
  rebuildAllSections();
  updateOutput();

  document.getElementById('btn-preview').addEventListener('click', openPreview);
  document.getElementById('btn-download').addEventListener('click', downloadDataJs);

  document.getElementById('btn-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importFromText(reader.result);
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm("Effacer le brouillon sauvegardé dans ce navigateur et repartir des données publiées sur ce site ?")) return;
    clearDraft();
    state = loadFromPublished();
    rebuildAllSections();
    updateOutput();
  });
});
