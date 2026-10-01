// ── Validation ───────────────────────────────────────────────────────────────
// Vérifie un objet CV (celui de data.js par défaut) et retourne la liste des
// problèmes trouvés — utile pour repérer un id de taxonomie mal orthographié,
// une entrée sans id, etc. Partagé entre app.js (vérifie CV au chargement du
// site) et editor.js (vérifie l'état en cours d'édition).

// ── Dates ────────────────────────────────────────────────────────────────────
// Une date du CV est une année seule (2021) ou "AAAA-MM" quand le mois est
// connu ("2021-03"). Les deux formes cohabitent librement.

// Valeur par défaut de CV.display.lisserCreuxMois (partagée site + éditeur).
const CV_LISSAGE_CREUX_DEFAUT = 3;

const CV_MOIS_COURTS =['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function parseCvDate(v) {
  if (typeof v === 'number' && Number.isInteger(v)) return { annee: v, mois: null };
  if (typeof v !== 'string') return null;
  let m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(v);
  if (m) return { annee: Number(m[1]), mois: Number(m[2]) };
  m = /^(\d{4})$/.exec(v);
  return m ? { annee: Number(m[1]), mois: null } : null;
}

// Position en mois entiers (comparaisons exactes, pas de flottants). Un mois
// de fin est inclus : "→ 2021-06" s'arrête là où "2021-07 →" commence, sans
// creux entre les deux. Une année seule garde le sens historique du projet
// (début de cette année), pour ne rien décaler sur les données sans mois.
function cvMonthIndex(v, edge) {
  const d = parseCvDate(v);
  if (!d) return null;
  if (d.mois == null) return d.annee * 12;
  return d.annee * 12 + (edge === 'end' ? d.mois : d.mois - 1);
}

function cvNowMonthIndex() {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth() + 1;
}

function composeCvDate(annee, mois) {
  if (!annee) return null;
  return mois ? `${annee}-${String(mois).padStart(2, '0')}` : Number(annee);
}

function validateCV(cv) {
  cv = cv || (typeof CV !== 'undefined' ? CV : undefined);
  const errors = [];
  if (!cv) {
    return ["L'objet CV est introuvable — vérifiez que les données sont chargées avant ce script (js/data.js dans index.html, ou sessionStorage dans preview.html)."];
  }
  if (!cv.profil || !cv.profil.nom) errors.push('CV.profil.nom est requis.');
  if (cv.profil && cv.profil.naissance != null && cv.profil.naissance !== '' && !parseCvDate(cv.profil.naissance)) {
    errors.push(`CV.profil.naissance "${cv.profil.naissance}" invalide (attendu : 1995 ou "1995-04").`);
  }
  if (cv.display && cv.display.lisserCreuxMois != null
      && !(Number.isInteger(cv.display.lisserCreuxMois) && cv.display.lisserCreuxMois >= 0)) {
    errors.push('CV.display.lisserCreuxMois doit être un nombre entier de mois (0 pour désactiver).');
  }

  if (!cv.taxonomie) {
    errors.push('CV.taxonomie est manquant.');
    return errors;
  }
  ['milieux', 'types', 'competences'].forEach(key => {
    if (!cv.taxonomie[key] || typeof cv.taxonomie[key] !== 'object') {
      errors.push(`CV.taxonomie.${key} est manquant ou n'est pas un objet.`);
    }
  });

  // Hiérarchie interne de milieux/competences : une entrée peut référencer
  // une autre de la même table via "parent" (racine = sans parent, ex. un
  // domaine de compétences ; feuille = avec parent, ex. une compétence
  // précise qui s'y rattache). Même mécanisme et mêmes risques que le
  // "parent" des entrées CV plus bas : existence, auto-référence, cycle.
  ['milieux', 'competences'].forEach(key => {
    const table = cv.taxonomie[key];
    if (!table || typeof table !== 'object') return;
    Object.entries(table).forEach(([id, entry]) => {
      if (!entry || entry.parent == null || entry.parent === '') return;
      if (entry.parent === id) {
        errors.push(`CV.taxonomie.${key}.${id} : parent ne peut pas se référencer lui-même.`);
        return;
      }
      if (!table[entry.parent]) {
        errors.push(`CV.taxonomie.${key}.${id} : parent "${entry.parent}" introuvable dans CV.taxonomie.${key}.`);
        return;
      }
      const seen = new Set([id]);
      let cursor = entry.parent;
      while (cursor != null && cursor !== '') {
        if (seen.has(cursor)) {
          errors.push(`CV.taxonomie.${key}.${id} : référence "parent" cyclique détectée.`);
          break;
        }
        seen.add(cursor);
        const next = table[cursor];
        cursor = next ? next.parent : null;
      }
    });
  });

  // CV.glossaire est optionnel, mais s'il existe il doit être bien formé —
  // les entrées "lieu" plus bas vérifient que leurs références y pointent.
  if (cv.glossaire != null && typeof cv.glossaire !== 'object') {
    errors.push('CV.glossaire doit être un objet (ou absent).');
  }

  const seenIds = new Set();
  const allItems = []; // pour la vérif des références "parent", qui peuvent pointer vers une autre collection
  const collections = { experiences: cv.experiences, formations: cv.formations, projets: cv.projets };
  Object.entries(collections).forEach(([name, list]) => {
    if (!Array.isArray(list)) {
      errors.push(`CV.${name} doit être un tableau (trouvé : ${typeof list}).`);
      return;
    }
    list.forEach((item, i) => {
      const label = item.id ? `"${item.id}"` : `#${i}`;
      if (!item.id) errors.push(`CV.${name}[${i}] : id manquant.`);
      else if (seenIds.has(item.id)) errors.push(`CV.${name} : id "${item.id}" utilisé plusieurs fois.`);
      else seenIds.add(item.id);

      if (!item.titre) errors.push(`CV.${name} ${label} : titre manquant.`);
      if (item.debut == null) errors.push(`CV.${name} ${label} : debut manquant.`);
      else if (!parseCvDate(item.debut)) errors.push(`CV.${name} ${label} : debut "${item.debut}" invalide (attendu : 2021 ou "2021-03").`);
      if (item.fin != null && !parseCvDate(item.fin)) {
        errors.push(`CV.${name} ${label} : fin "${item.fin}" invalide (attendu : 2021 ou "2021-03").`);
      } else if (item.fin != null && parseCvDate(item.debut)) {
        const d = parseCvDate(item.debut), f = parseCvDate(item.fin);
        const avant = f.annee < d.annee || (f.annee === d.annee && f.mois != null && d.mois != null && f.mois < d.mois);
        if (avant) errors.push(`CV.${name} ${label} : fin antérieure au début.`);
      }

      if (item.type && cv.taxonomie.types && !cv.taxonomie.types[item.type]) {
        errors.push(`CV.${name} ${label} : type "${item.type}" absent de CV.taxonomie.types.`);
      }
      (item.milieux || []).forEach(m => {
        if (cv.taxonomie.milieux && !cv.taxonomie.milieux[m]) {
          errors.push(`CV.${name} ${label} : milieu "${m}" absent de CV.taxonomie.milieux.`);
        }
      });
      (item.competences || []).forEach(comp => {
        if (cv.taxonomie.competences && !cv.taxonomie.competences[comp]) {
          errors.push(`CV.${name} ${label} : compétence "${comp}" absente de CV.taxonomie.competences.`);
        }
      });

      if (item.lieu != null) {
        if (!Array.isArray(item.lieu)) {
          errors.push(`CV.${name} ${label} : lieu doit être un tableau (ex. [{ type: "ville", valeur: "Genève" }]).`);
        } else {
          item.lieu.forEach((l, li) => {
            if (!l || !l.valeur) errors.push(`CV.${name} ${label} : lieu[${li}] sans "valeur".`);
            if (l && l.glossaire && (!cv.glossaire || !cv.glossaire[l.glossaire])) {
              errors.push(`CV.${name} ${label} : lieu[${li}] référence le glossaire "${l.glossaire}", introuvable dans CV.glossaire.`);
            }
          });
        }
      }

      allItems.push({ collection: name, item, label });
    });
  });

  // Références "parent" (sous-engagement d'une autre entrée, toutes
  // collections confondues) : doit exister, pas d'auto-référence, pas de
  // cycle (sinon l'affichage de la frise boucle à l'infini).
  const byId = new Map(allItems.map(e => [e.item.id, e]));
  allItems.forEach(({ collection, item, label }) => {
    if (item.parent == null || item.parent === '') return;
    if (item.parent === item.id) {
      errors.push(`CV.${collection} ${label} : parent ne peut pas se référencer lui-même.`);
      return;
    }
    if (!byId.has(item.parent)) {
      errors.push(`CV.${collection} ${label} : parent "${item.parent}" introuvable (aucune entrée avec cet id).`);
      return;
    }
    // Détection de cycle : en remontant les parents depuis cette entrée, on
    // ne doit jamais retomber sur elle-même.
    const seen = new Set([item.id]);
    let cursor = item.parent;
    while (cursor != null && cursor !== '') {
      if (seen.has(cursor)) {
        errors.push(`CV.${collection} ${label} : référence "parent" cyclique détectée.`);
        break;
      }
      seen.add(cursor);
      const next = byId.get(cursor);
      cursor = next ? next.item.parent : null;
    }
  });

  return errors;
}
