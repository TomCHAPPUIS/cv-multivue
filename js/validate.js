// ── Validation ───────────────────────────────────────────────────────────────
// Vérifie un objet CV (celui de data.js par défaut) et retourne la liste des
// problèmes trouvés — utile pour repérer un id de taxonomie mal orthographié,
// une entrée sans id, etc. Partagé entre app.js (vérifie CV au chargement du
// site) et editor.js (vérifie l'état en cours d'édition).

function validateCV(cv) {
  cv = cv || (typeof CV !== 'undefined' ? CV : undefined);
  const errors = [];
  if (!cv) {
    return ["L'objet CV est introuvable — vérifiez que les données sont chargées avant ce script (js/data.js dans index.html, ou sessionStorage dans preview.html)."];
  }
  if (!cv.profil || !cv.profil.nom) errors.push('CV.profil.nom est requis.');

  if (!cv.taxonomie) {
    errors.push('CV.taxonomie est manquant.');
    return errors;
  }
  ['domaines', 'types', 'competences'].forEach(key => {
    if (!cv.taxonomie[key] || typeof cv.taxonomie[key] !== 'object') {
      errors.push(`CV.taxonomie.${key} est manquant ou n'est pas un objet.`);
    }
  });

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

      if (item.type && cv.taxonomie.types && !cv.taxonomie.types[item.type]) {
        errors.push(`CV.${name} ${label} : type "${item.type}" absent de CV.taxonomie.types.`);
      }
      (item.domaines || []).forEach(d => {
        if (cv.taxonomie.domaines && !cv.taxonomie.domaines[d]) {
          errors.push(`CV.${name} ${label} : domaine "${d}" absent de CV.taxonomie.domaines.`);
        }
      });
      (item.competences || []).forEach(comp => {
        if (cv.taxonomie.competences && !cv.taxonomie.competences[comp]) {
          errors.push(`CV.${name} ${label} : compétence "${comp}" absente de CV.taxonomie.competences.`);
        }
      });

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
