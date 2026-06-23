import type { DeepPartial, Messages } from "../dictionaries";

// Dictionnaire ANGLAIS — surcharges uniquement. Toute clé absente ici
// retombe automatiquement sur le français (fallback).
export const en: DeepPartial<Messages> = {
  language: {
    label: "Language",
  },
  common: {
    signOut: "Sign out",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    apply: "Apply",
    loading: "Loading…",
    search: "Search",
    yes: "Yes",
    no: "No",
  },
  layout: {
    adminTitle: "VORALIS Back-office",
    panelTitle: "Webmaster area",
  },
  nav: {
    dashboard: "Dashboard",
    orders: "Lead processing",
    bulkUpdate: "Bulk update",
    products: "Product management",
    affiliates: "Affiliate network & affiliates",
    statuses: "Status management",
    statistics: "Statistics",
    panelHome: "Dashboard",
    myLeads: "My leads",
    panelProducts: "Products",
    apiPostback: "API & Postback",
    account: "My account",
  },
};
