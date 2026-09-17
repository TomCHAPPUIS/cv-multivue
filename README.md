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
2. Renseignez vos données de l'une des deux façons suivantes :
   - **Éditeur visuel** (recommandé si vous n'êtes pas à l'aise avec le
     code) : ouvrez `editor.html` dans un navigateur, remplissez le
     formulaire, cliquez sur **Prévisualiser** pour voir le rendu en
     direct, puis **Télécharger data.js** et remplacez `js/data.js` par le
     fichier téléchargé. Rien n'est envoyé nulle part : tout reste dans
     votre navigateur tant que vous ne téléchargez pas.
   - **Édition directe** : ouvrez `js/data.js` et remplacez le contenu
     d'exemple par le vôtre (voir "Modèle de données" ci-dessous — chaque
     section du fichier est commentée). Une erreur de syntaxe ou une
     référence de taxonomie inexistante affiche un message d'erreur
     explicite au chargement plutôt qu'une page blanche.
3. Ouvrez `index.html` dans un navigateur pour prévisualiser — aucun
   serveur ni build nécessaire.
4. Déployez `index.html` + `css/` + `js/` sur n'importe quel hébergeur
   statique : GitHub Pages, Netlify, Vercel, ou un simple `nginx`/`python
   -m http.server` sur votre propre machine. (`editor.html`/`preview.html`
   sont des outils de saisie, pas obligatoires pour le site publié — vous
   pouvez les exclure du déploiement si vous préférez.)

## Modèle de données

`js/data.js` expose un unique objet global `CV`, structuré en trois
couches :

- **`CV.theme`** — apparence du site, pour que votre instance ne ressemble
  pas à celle de tout le monde. `preset` : `"ambre"` (défaut) / `"ocean"` /
  `"foret"` / `"mono"`. Pour aller plus loin, `overrides` permet de
  surcharger des couleurs individuelles par-dessus le preset (ex.
  `overrides: { accent: "#2563eb" }`) — clés disponibles : `accent`, `bg`,
  `sidebarBg`, `sidebarText` (codes hexadécimaux).
- **`CV.profil`** — votre identité publique (nom, titre, photo, ville,
  pays, bio), affichée dans la barre latérale. `photo` accepte une URL,
  un chemin relatif, ou une image intégrée directement (data URI générée
  par `editor.html`). Volontairement **aucun téléphone/email ici** — voir
  `CV.contact` ci-dessous.
- **`CV.contact`** — comment on vous contacte, sans exposer votre adresse
  en clair dans le code de la page (évite le moissonnage automatique une
  fois le site en ligne). Deux modes au choix :
  - `mode: "mailto"` (par défaut) — lien mailto classique. Simple, mais
    l'adresse reste lisible dans le code source de la page.
  - `mode: "form"` — un vrai formulaire, envoyé via un service tiers
    gratuit (ex. [Formspree](https://formspree.io),
    [Web3Forms](https://web3forms.com)) : créez un compte, récupérez
    l'URL de formulaire fournie, collez-la dans `formAction`. Aucune
    adresse visible dans le code ; en contrepartie, dépend d'un service
    tiers que vous configurez vous-même (rien à héberger de votre côté).
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
index.html        ← le site publié (générique, ne pas modifier)
editor.html        ← formulaire de saisie (outil, pas nécessaire en prod)
preview.html        ← aperçu utilisé par editor.html (idem)
css/
  style.css          ← mise en forme du site (générique)
  editor.css          ← mise en forme de l'éditeur (générique)
js/
  data.js               ← VOS données (le seul fichier à éditer à la main)
  validate.js            ← vérifie data.js, partagé site + éditeur (générique)
  app.js                  ← logique de rendu des 3 vues (générique)
  editor.js                ← logique du formulaire de saisie (générique)
```

## Licence

MIT — voir [LICENSE](LICENSE). Utilisez, modifiez et redistribuez
librement.
