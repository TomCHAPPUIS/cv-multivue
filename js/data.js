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
  // Renommez/ajoutez/supprimez librement les clés (culture, technique, ...) —
  // elles servent uniquement de clés étrangères depuis vos entrées plus bas.
  taxonomie: {
    // Domaines : catégories thématiques (vue "Par domaine").
    domaines: {
      management:    { label: "Gestion & organisation", couleur: "#7c3aed" },
      technique:     { label: "Technique",               couleur: "#d97706" },
      creatif:       { label: "Créatif",                 couleur: "#059669" },
      communication: { label: "Communication",           couleur: "#2563eb" },
      formation:     { label: "Formation",                couleur: "#b91c1c" }
    },
    // Types : nature de l'entrée (badge affiché sur chaque carte).
    types: {
      emploi:     { label: "Emploi",           couleur: "#1e40af" },
      associatif: { label: "Bénévolat",        couleur: "#065f46" },
      formation:  { label: "Formation",        couleur: "#78350f" },
      projet:     { label: "Projet personnel", couleur: "#5b21b6" }
    },
    // Compétences : groupées par catégorie (vue "Par compétence").
    competences: {
      "gestion-projet": { label: "Gestion de projet",      groupe: "Management" },
      "budget":         { label: "Budget & finance",       groupe: "Management" },
      "communication":  { label: "Communication",          groupe: "Relationnel" },
      "encadrement":    { label: "Encadrement d'équipe",   groupe: "Relationnel" },
      "developpement":  { label: "Développement logiciel", groupe: "Technique" },
      "design":         { label: "Design",                 groupe: "Créatif" }
    }
  },

  // Vos expériences professionnelles/associatives.
  // Champs : id (unique), titre, organisation, lieu, debut/fin (années,
  // fin=null si actuel), actuel (bool), type (clé de taxonomie.types),
  // domaines[]/competences[] (clés de taxonomie), description, points_cles[].
  experiences: [
    {
      id: "exemple-poste-actuel",
      titre: "Intitulé du poste",
      organisation: "Nom de l'organisation",
      lieu: "Ville",
      debut: 2022,
      fin: null,
      actuel: true,
      type: "emploi",
      domaines: ["management", "technique"],
      competences: ["gestion-projet", "encadrement"],
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
      lieu: "Ville",
      debut: 2019,
      fin: 2022,
      actuel: false,
      type: "associatif",
      domaines: ["creatif", "communication"],
      competences: ["communication", "design"],
      description: "Une phrase résumant le poste.",
      points_cles: ["Réalisation concrète #1", "Réalisation concrète #2"]
    }
  ],

  // Vos formations. Mêmes champs que les expériences, plus "etablissement".
  formations: [
    {
      id: "exemple-formation",
      titre: "Intitulé du diplôme",
      organisation: "Nom du département/de la faculté",
      etablissement: "Nom de l'établissement",
      lieu: "Ville",
      debut: 2018,
      fin: 2021,
      actuel: false,
      type: "formation",
      domaines: ["formation", "technique"],
      competences: ["developpement"],
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
      lieu: null,
      debut: 2024,
      fin: null,
      actuel: true,
      type: "projet",
      domaines: ["technique"],
      competences: ["developpement"],
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
