import { z } from "zod";

// Indicatif : pays principalement traités. N'est plus une restriction —
// les affiliés peuvent envoyer un lead pour n'importe quel pays.
export const SUPPORTED_COUNTRIES = ["AO", "ML", "SN", "CI", "GN", "GA", "CG", "MA"] as const;

export const leadSchema = z.object({
  // Offre facultative : un lead peut être envoyé sans la rattacher à une offre.
  offer_id: z.string().min(1).optional().nullable(),
  // Produit (colonne "Produit" du tableau des leads) — obligatoire.
  product: z.string().min(1, "product requis").max(200),
  first_name: z.string().min(1, "first_name requis").max(120),
  // Nom de famille obligatoire.
  last_name: z.string().min(1, "last_name requis").max(120),
  phone: z
    .string()
    .min(6, "téléphone trop court")
    .max(20)
    .regex(/^[+0-9\s().-]+$/, "format téléphone invalide"),
  // Pays obligatoire : code ISO à 2 lettres, sans restriction de liste.
  country: z
    .string()
    .length(2, "code pays sur 2 lettres")
    .regex(/^[A-Za-z]{2}$/, "code pays invalide")
    .transform((c) => c.toUpperCase()),
  // Adresse, ville et quantité obligatoires.
  address: z.string().min(1, "address requis").max(300),
  city: z.string().min(1, "city requis").max(120),
  quantity: z.coerce.number().int().min(1, "quantity requis").max(99),
  ip: z.string().max(60).optional().nullable(),
  user_agent: z.string().max(400).optional().nullable(),
  // Affiliate (sous-affilié) obligatoire.
  affiliate: z.string().min(1, "affiliate requis").max(255),
  sub3: z.string().max(255).optional().nullable(),
  sub4: z.string().max(255).optional().nullable(),
  sub5: z.string().max(255).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
});

export type LeadInput = z.infer<typeof leadSchema>;
