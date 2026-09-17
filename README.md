# cv-multivue

Un CV personnel en une page, mais navigable selon trois angles différents —
**chronologique**, **par domaine** et **par compétence** — plutôt que la
liste unique imposée par un CV papier ou PDF classique.

Site 100% statique (HTML/CSS/JS, aucune dépendance, aucun build step) :
toutes vos données vivent dans un seul fichier, `js/data.js`. Forkez ce
repo, éditez ce fichier, déployez — c'est tout.

**[→ Voir la démo](https://tomchappuis.github.io/cv-multivue/)** (données
d'exemple fictives)

## Les trois vues

1. **Chronologique** — timeline classique, triée par date.
2. **Par domaine** — vos expériences regroupées par thématique (ex :
   technique, management, créatif...), avec filtre.
3. **Par compétence** — vos expériences regroupées par compétence,
   groupées par catégorie (Management / Relationnel / Technique / ...).

Les trois vues sont générées à partir des **mêmes données** — vous ne
saisissez chaque expérience qu'une seule fois, en la rattachant aux
domaines et compétences concernés.

## Démarrage rapide

1. Cliquez sur **"Use this template"** en haut de la page GitHub (crée
   votre propre copie indépendante, sans historique lié à ce repo) — ou
   forkez/clonez-le directement.
2. Ouvrez `js/data.js` et remplacez le contenu d'exemple par le vôtre
   (voir "Modèle de données" ci-dessous). Chaque section du fichier est
   commentée.
3. Ouvrez `index.html` dans un navigateur pour prévisualiser — aucun
   serveur ni build nécessaire.
4. Déployez `index.html` + `css/` + `js/` sur n'importe quel hébergeur
   statique : GitHub Pages, Netlify, Vercel, ou un simple `nginx`/`python
   -m http.server` sur votre propre machine.

## Modèle de données

`js/data.js` expose un unique objet global `CV`, structuré en trois
couches :

- **`CV.profil`** — vos coordonnées (nom, titre, contact...), affichées
  dans la barre latérale.
- **`CV.taxonomie`** — trois tables de référence qui définissent votre
  propre vocabulaire : `domaines`, `types`, `competences`. Chaque entrée a
  un id court (ex. `technique`), un `label` affiché et, pour
  domaines/types, une `couleur`. Entièrement personnalisable : renommez,
  ajoutez ou supprimez des entrées librement.
- **Les entrées** — `CV.experiences`, `CV.formations`, `CV.projets` :
  trois listes qui partagent un schéma commun (`id`, `titre`,
  `organisation`, `lieu`, `debut`/`fin`, `actuel`, `type`, `domaines[]`,
  `competences[]`, `description`, `points_cles[]`). `type` référence une
  clé de `taxonomie.types` ; `domaines[]`/`competences[]` référencent des
  clés de `taxonomie.domaines`/`taxonomie.competences` (relations
  many-to-many : une expérience peut toucher plusieurs domaines et
  compétences). `formations` ajoute `etablissement` ; `projets` ajoute
  `technologies[]` et un flag `placeholder` (affiche un badge "À
  compléter", à retirer une fois l'entrée finalisée).
- **`CV.langues`** — liste indépendante, affichée en bas de la barre
  latérale.

Ajouter une entrée ne demande donc que de respecter ce schéma et de
référencer des clés de taxonomie existantes (ou nouvelles) — les trois
vues s'adaptent automatiquement, sans toucher au code.

## Structure du projet

```
index.html       ← squelette de page (générique, ne pas modifier)
css/style.css     ← mise en forme (générique, ne pas modifier)
js/
  data.js         ← VOS données (le seul fichier à éditer)
  app.js          ← logique de rendu des 3 vues (générique, ne pas modifier)
```

## Licence

MIT — voir [LICENSE](LICENSE). Utilisez, modifiez et redistribuez
librement.
