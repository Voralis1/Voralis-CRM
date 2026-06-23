// Dictionnaire FRANÇAIS — langue de référence (source de vérité).
// Toute clé manquante en anglais retombe automatiquement sur cette version.
export const fr = {
  language: {
    label: "Langue",
    fr: "Français",
    en: "English",
  },
  common: {
    signOut: "Déconnexion",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Éditer",
    create: "Créer",
    apply: "Appliquer",
    loading: "Chargement…",
    search: "Rechercher",
    yes: "Oui",
    no: "Non",
  },
  layout: {
    adminTitle: "Back-office VORALIS",
    panelTitle: "Espace Webmaster",
  },
  nav: {
    // Back-office (admin / agent)
    dashboard: "Tableau de bord",
    orders: "Traitement des leads",
    bulkUpdate: "Mise à jour",
    products: "Gestion de produits",
    affiliates: "Affiliate network & affiliates",
    statuses: "Gestion des status",
    statistics: "Statistiques",
    // Panel (webmaster / affilié)
    panelHome: "Tableau de bord",
    myLeads: "Mes leads",
    panelProducts: "Produits",
    apiPostback: "API & Postback",
    account: "Mon compte",
  },
};

export type Messages = typeof fr;
