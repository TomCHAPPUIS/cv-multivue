# cv-multivue

Un CV personnel en une page, mais navigable selon trois angles différents —
**chronologique**, **par milieu** et **par compétence** — plutôt que la
liste unique imposée par un CV papier ou PDF classique.

Site 100% statique (HTML/CSS/JS, aucune dépendance, aucun build step) :
toutes vos données vivent dans un seul fichier, `js/data.js`. Forkez ce
repo, éditez ce fichier, déployez — c'est tout.

**[→ Voir la démo](https://tomchappuis.github.io/cv-multivue/)** (données
d'exemple fictives)

## Les trois vues

1. **Chronologique** — frise proportionnelle (position/durée proportionnelles
   au temps) : les périodes qui se chevauchent s'affichent côte à côte au
   lieu d'être noyées dans une liste. Repli automatique sur une liste
   simple en dessous de 720px de large.
2. **Par milieu** — vos expériences regroupées par secteur/contexte
   professionnel (ex : numérique, culture, santé...), avec filtre. C'est ce
   que fait *l'organisation*, pas ce que vous y avez fait.
3. **Par compétence** — vos expériences regroupées par compétence,
   groupées par domaine de compétences (ex : Informatique et données,
   Direction et stratégie...). C'est ce que *vous* avez fait, quel que soit
   le secteur où vous l'avez fait — un développeur en banque et un
   développeur dans une association ont la même compétence, dans deux
   milieux différents.

Un bouton **Imprimer / PDF** dans la barre latérale ouvre l'aperçu
d'impression du navigateur (Ctrl/Cmd+P fonctionne aussi) — la frise bascule
automatiquement sur sa version liste pour l'impression, plus adaptée à la
pagination papier.

Les trois vues sont générées à partir des **mêmes données** — vous ne
saisissez chaque expérience qu'une seule fois, en la rattachant aux
milieux et compétences concernés.

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
     votre navigateur. Votre saisie est **sauvegardée automatiquement**
     dans ce navigateur (survit à un rechargement de page) jusqu'à ce que
     vous cliquiez sur **Réinitialiser**. Le bouton **Importer un
     data.js** permet de recharger un fichier existant (le vôtre, ou celui
     d'une autre instance) dans le formulaire — pratique pour tester
     l'éditeur sur la démo publique avec vos propres données sans les
     ressaisir.
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

   Si vous auto-hébergez via nginx et que vous itérez souvent sur vos
   données, pensez à désactiver le cache agressif (`Cache-Control:
   no-cache, must-revalidate` sur la `location /`) — sinon un
   redéploiement peut sembler "ne rien changer" tant que le navigateur
   n'est pas rafraîchi en forçant (Ctrl+Shift+R).

## Modèle de données

`js/data.js` expose un unique objet global `CV`, structuré en trois
couches :

- **`CV.theme`** — apparence du site, pour que votre instance ne ressemble
  pas à celle de tout le monde. `preset` : `"ambre"` (défaut) / `"ocean"` /
  `"foret"` / `"mono"`. Pour aller plus loin, `overrides` permet de
  surcharger des couleurs individuelles par-dessus le preset (ex.
  `overrides: { accent: "#2563eb" }`) — clés disponibles : `accent`, `bg`,
  `sidebarBg`, `sidebarText` (codes hexadécimaux).
- **`CV.display`** — quels champs afficher. Pour l'instant :
  `masquerTypesLieu: []`, une liste de `type` de lieu (voir plus bas) à
  masquer partout sur le site — utile si, par exemple, toutes vos
  expériences sont dans la même ville et que la répéter partout n'apporte
  rien.
- **`CV.glossaire`** (optionnel) — petites définitions pour les termes qui
  le méritent (`{ id: { terme, definition } }`). N'apparaît jamais dans la
  navigation du site : une valeur qui référence une entrée du glossaire
  (voir `lieu[].glossaire` plus bas) devient cliquable et ouvre sa
  définition dans une fenêtre, où qu'elle soit affichée.
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
  propre vocabulaire : `milieux`, `types`, `competences`. Chaque entrée a
  un id court (ex. `numerique`), un `label` affiché et, pour
  milieux/types, une `couleur`. Entièrement personnalisable : renommez,
  ajoutez ou supprimez des entrées librement.

  `milieux` et `competences` sont **deux axes volontairement séparés**,
  qui répondent chacun à une question différente :
  - `milieux` — ce que fait *l'organisation* (son secteur d'activité :
    numérique, santé, culture...).
  - `competences` — ce que fait *la personne* (le type de travail
    exercé : gestion de projet, développement logiciel...).

  Les deux se croisent librement sur une même expérience : un
  développeur en banque = milieu `finance` × compétence
  `developpement-logiciel`. Ne codez jamais une expérience d'après le mot
  qui "sonne juste" — `informatique` existe des deux côtés (un milieu
  *et* un domaine de compétences), et ce n'est pas un défaut du modèle.

  Ces deux tables supportent en plus une **hiérarchie à deux niveaux** :
  une entrée sans `parent` est une racine (un milieu, ou un *domaine de
  compétences* comme "Informatique et données") ; une entrée avec
  `parent` (l'id d'une autre entrée de la même table) en est une
  sous-catégorie (ex. "Développement logiciel" sous "Informatique et
  données"). `validateCV` vérifie ces références comme celles de
  `parent` sur les entrées (existence, auto-référence, cycle — voir
  plus bas). Une expérience peut référencer une racine ou une
  sous-catégorie indifféremment dans `milieux[]` ; pour `competences[]`,
  seules les sous-catégories ont vocation à être référencées — la racine
  n'est qu'un en-tête de regroupement pour la vue "Par compétence".
- **Les entrées** — `CV.experiences`, `CV.formations`, `CV.projets` :
  trois listes qui partagent un schéma commun (`id`, `titre`,
  `organisation`, `debut`/`fin`, `actuel`, `type`, `milieux[]`,
  `competences[]`, `description`, `points_cles[]`). `type` référence une
  clé de `taxonomie.types` ; `milieux[]`/`competences[]` référencent des
  clés de `taxonomie.milieux`/`taxonomie.competences` (relations
  many-to-many : une expérience peut toucher plusieurs milieux et
  compétences). `formations` ajoute `etablissement` ; `projets` ajoute
  `technologies[]` et un flag `placeholder` (affiche un badge "À
  compléter", à retirer une fois l'entrée finalisée).
  - `lieu` (optionnel) : tableau de `{ type, valeur, glossaire? }` plutôt
    qu'un simple texte — vous choisissez vos propres catégories de lieu
    (`"ville"`, `"institution"`, `"antenne"`, ou autre chose de pertinent
    selon l'entrée), chacune avec sa propre valeur. `glossaire` (optionnel)
    référence une clé de `CV.glossaire` pour rendre cette valeur cliquable.
    Exemple :
    ```js
    lieu: [
      { type: "ville", valeur: "Genève", glossaire: "geneve" },
      { type: "institution", valeur: "Université de Genève" }
    ]
    ```
  - `parent` (optionnel) : id d'une autre entrée (n'importe quelle
    collection) dont celle-ci est un sous-engagement — utile pour détailler
    un engagement long (ex. une présidence) sans lui faire perdre en
    lisibilité sur la frise. Une entrée avec `parent` n'a pas sa propre
    barre : elle apparaît dans un badge extensible sur la barre de son
    parent (chaîne aussi profonde que voulu, ex.
    engagement → sous-engagement → tâche). Validé par `validateCV` (id
    inconnu, auto-référence et cycles détectés).
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
favicon.svg          ← icône par défaut (remplaçable)
css/
  style.css          ← mise en forme du site (générique, inclut l'impression)
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
