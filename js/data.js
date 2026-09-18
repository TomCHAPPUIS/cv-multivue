// ─────────────────────────────────────────────────────────────────────────
// data.js — toutes les données de votre CV. C'est le SEUL fichier à éditer
// pour personnaliser le site : index.html/app.js/style.css sont génériques
// et n'ont besoin d'aucune modification.
//
// Schéma complet documenté dans README.md.
// ─────────────────────────────────────────────────────────────────────────

const CV = {
  // Apparence — pour que votre site ne ressemble pas à celui de tout le
  // monde. preset au choix : "ambre" (défaut) | "ocean" | "foret" | "mono".
  // Pour aller plus loin, surchargez une ou plusieurs couleurs par-dessus
  // le preset (accent, bg, sidebarBg, sidebarText — codes hexadécimaux) :
  //   overrides: { accent: "#2563eb" }
  theme: {
    preset: "ambre"
  },

  // Réglages d'affichage — utile par exemple si toutes vos expériences sont
  // dans la même ville : masquerTypesLieu: ["ville"] la retire de partout
  // sans avoir à toucher chaque entrée. Les valeurs possibles dépendent des
  // "type" que vous utilisez vous-même dans lieu[] plus bas (texte libre).
  display: {
    masquerTypesLieu: []
  },

  // Identité publique — ce que vous accepteriez de voir sur un réseau
  // social. Volontairement AUCUN téléphone/email ici : voir CV.contact
  // ci-dessous pour ça.
  profil: {
    nom: "Alex Dupont",
    titre: "Chef·fe de projet",
    sousTitre: "Exemple — remplacez ceci par votre propre sous-titre",
    photo: "", // URL, chemin relatif, ou data URI (intégrée via editor.html) — laisser vide pour ne rien afficher
    ville: "Votre ville",
    pays: "Suisse",
    bio: "Une bio courte (2-3 phrases). Non affichée par les vues actuelles, mais disponible si vous étendez le template."
  },

  // Contact — jamais de téléphone/email affiché en clair dans le code de
  // la page par défaut, pour éviter le moissonnage automatique (spam,
  // scraping) une fois le site en ligne.
  //   mode "mailto" : lien mailto classique. Le plus simple, mais votre
  //                   adresse reste lisible dans le code source de la page.
  //   mode "form"   : un vrai formulaire, envoyé via un service tiers
  //                   gratuit (ex. Formspree, Web3Forms) — aucune adresse
  //                   visible dans le code. Créez un compte sur l'un de ces
  //                   services, récupérez l'URL de formulaire fournie, et
  //                   collez-la dans formAction.
  contact: {
    mode: "mailto",
    email: "vous@exemple.com",
    formAction: "" // ex: "https://formspree.io/f/xxxxxxxx" — mode "form" uniquement
  },

  // Tables de référence : chaque entrée ci-dessous n'est qu'un EXEMPLE.
  // Renommez/ajoutez/supprimez librement les clés — elles servent
  // uniquement de clés étrangères depuis vos entrées plus bas.
  //
  // Deux axes volontairement séparés (voir "Modèle de données" du README) :
  //   - milieux      : ce que fait L'ORGANISATION (son secteur).
  //   - competences  : ce que fait LA PERSONNE (le travail exercé),
  //                    indépendamment du secteur où elle l'a exercé.
  // Un développeur en banque = milieu "finance" × compétence "développement".
  taxonomie: {
    // Milieux : le secteur/contexte de l'organisation (vue "Par milieu").
    // Hiérarchie à deux niveaux : une entrée sans "parent" est un milieu
    // racine ; avec "parent", une sous-catégorie de ce milieu. Une
    // expérience peut référencer directement une racine ou une sous-catégorie.
    milieux: {
      numerique:                 { label: "Numérique et télécommunications", couleur: "#2563eb" },
      "edition-logicielle-saas": { label: "Édition logicielle et SaaS",      couleur: "#2563eb", parent: "numerique" },
      "donnees-ia":               { label: "Données et IA",                  couleur: "#2563eb", parent: "numerique" },
      "culture-medias-sport":     { label: "Culture, médias et sport",       couleur: "#059669" },
      "spectacle-vivant-musique": { label: "Spectacle vivant et musique",    couleur: "#059669", parent: "culture-medias-sport" },
      "education-recherche":      { label: "Éducation, formation et recherche", couleur: "#b91c1c" },
      superieur:                  { label: "Supérieur",                      couleur: "#b91c1c", parent: "education-recherche" }
    },
    // Types : nature de l'entrée (badge affiché sur chaque carte).
    types: {
      emploi:     { label: "Emploi",           couleur: "#1e40af" },
      associatif: { label: "Bénévolat",        couleur: "#065f46" },
      formation:  { label: "Formation",        couleur: "#78350f" },
      projet:     { label: "Projet personnel", couleur: "#5b21b6" }
    },
    // Compétences : ce que vous avez fait (vue "Par compétence"). Même
    // mécanisme de hiérarchie que les milieux : une entrée sans "parent" est
    // un domaine de compétences (catégorie, ex. "Informatique et données") ;
    // avec "parent", une compétence précise qui s'y rattache (ex.
    // "Développement logiciel"). Seules les compétences (avec parent) sont
    // proposées comme cases à cocher — le domaine, lui, n'est qu'un en-tête.
    competences: {
      "direction-strategie":            { label: "Direction et stratégie" },
      "gestion-projet":                 { label: "Gestion de projet et de programme", parent: "direction-strategie" },
      "finance-comptabilite":           { label: "Finance et comptabilité" },
      "controle-gestion":               { label: "Contrôle de gestion", parent: "finance-comptabilite" },
      "marketing-communication":        { label: "Marketing et communication" },
      "communication-institutionnelle": { label: "Communication institutionnelle", parent: "marketing-communication" },
      "ressources-humaines":            { label: "Ressources humaines" },
      "developpement-rh":               { label: "Développement RH", parent: "ressources-humaines" },
      "informatique-donnees":           { label: "Informatique et données" },
      "developpement-logiciel":         { label: "Développement logiciel", parent: "informatique-donnees" },
      "creation-contenus":              { label: "Création, design et production de contenus" },
      "design-ux-ui":                   { label: "Design UX/UI", parent: "creation-contenus" }
    }
  },

  // Glossaire (optionnel) : petites définitions pour les termes qui le
  // méritent (un lieu, une institution...). N'apparaît nulle part dans la
  // navigation — juste accessible en cliquant sur un terme qui le
  // référence (ex. via lieu[].glossaire plus bas).
  glossaire: {
    "exemple-lieu": {
      terme: "Ville",
      definition: "Une petite explication de ce lieu : pourquoi il compte dans votre parcours, ce qui s'y est passé, etc."
    }
  },

  // Vos expériences professionnelles/associatives.
  // Champs : id (unique), titre, organisation, debut/fin (années,
  // fin=null si actuel), actuel (bool), type (clé de taxonomie.types),
  // milieux[]/competences[] (clés de taxonomie), description, points_cles[].
  // lieu (optionnel) : tableau de { type, valeur, glossaire? } — le "type"
  // est du texte libre (ville, institution, antenne, salle...), à vous de
  // choisir vos propres catégories. glossaire (optionnel) référence une clé
  // de CV.glossaire ci-dessus pour rendre la valeur cliquable.
  // parent (optionnel) : id d'une autre entrée dont celle-ci est un
  // sous-engagement — voir README.md, section "Modèle de données".
  experiences: [
    {
      id: "exemple-poste-actuel",
      titre: "Intitulé du poste",
      organisation: "Nom de l'organisation",
      lieu: [
        { type: "ville", valeur: "Ville", glossaire: "exemple-lieu" },
        { type: "institution", valeur: "Nom de l'institution" }
      ],
      debut: 2022,
      fin: null,
      actuel: true,
      type: "emploi",
      milieux: ["edition-logicielle-saas"],
      competences: ["gestion-projet", "developpement-rh"],
      description: "Une phrase résumant le poste.",
      points_cles: [
        "Réalisation concrète #1",
        "Réalisation concrète #2",
        "Réalisation concrète #3"
      ]
    },
    {
      id: "exemple-poste-precedent",
      titre: "Intitulé du poste précédent",
      organisation: "Nom de l'organisation",
      lieu: [{ type: "ville", valeur: "Ville" }],
      debut: 2019,
      fin: 2022,
      actuel: false,
      type: "associatif",
      milieux: ["spectacle-vivant-musique"],
      competences: ["communication-institutionnelle", "design-ux-ui"],
      description: "Une phrase résumant le poste.",
      points_cles: ["Réalisation concrète #1", "Réalisation concrète #2"]
    },
    {
      // Exemple de sous-engagement : n'apparaît pas comme une barre à part
      // sur la frise, mais dans un badge extensible sur la barre du poste
      // ci-dessus (grâce à "parent"). Pratique pour détailler un engagement
      // long sans surcharger la frise principale.
      id: "exemple-sous-engagement",
      titre: "Exemple de sous-engagement",
      organisation: "Nom de l'organisation",
      lieu: [{ type: "ville", valeur: "Ville" }],
      debut: 2023,
      fin: 2023,
      actuel: false,
      type: "emploi",
      milieux: ["numerique"],
      competences: [],
      description: "Un projet ou une tâche ponctuelle rattaché au poste principal.",
      points_cles: [],
      parent: "exemple-poste-actuel"
    }
  ],

  // Vos formations. Mêmes champs que les expériences, plus "etablissement".
  formations: [
    {
      id: "exemple-formation",
      titre: "Intitulé du diplôme",
      organisation: "Nom du département/de la faculté",
      etablissement: "Nom de l'établissement",
      lieu: [{ type: "ville", valeur: "Ville" }],
      debut: 2018,
      fin: 2021,
      actuel: false,
      type: "formation",
      milieux: ["superieur"],
      competences: ["developpement-logiciel"],
      description: "Une phrase résumant la formation."
    }
  ],

  // Vos projets personnels. Mêmes champs que les expériences, plus
  // "technologies" (chips affichées sur la carte) et "placeholder"
  // (badge "À compléter" — à retirer une fois l'entrée finalisée).
  projets: [
    {
      id: "exemple-projet",
      titre: "Nom du projet",
      organisation: "Projet personnel",
      debut: 2024,
      fin: null,
      actuel: true,
      type: "projet",
      milieux: ["donnees-ia"],
      competences: ["developpement-logiciel"],
      technologies: ["JavaScript", "CSS"],
      description: "Une phrase résumant le projet.",
      points_cles: [],
      placeholder: true
    }
  ],

  // Langues, affichées en bas de la barre latérale.
  langues: [
    { langue: "Français", niveau: "Natif" },
    { langue: "Anglais",  niveau: "B2"    }
  ]
};
