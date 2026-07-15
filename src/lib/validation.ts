import { z } from "zod";

// Indicatif : pays principalement traités. N'est plus une restriction —
// les affiliés peuvent envoyer un lead pour n'importe quel pays.
export const SUPPORTED_COUNTRIES = ["AO", "ML", "SN", "CI", "GN", "GA", "CG", "MA"] as const;

export const leadSchema = z
  .object({
    // Produit : au moins un des deux est obligatoire (voir superRefine
    // ci-dessous). product_id est prioritaire s'il est fourni.
    product_id: z.string().min(1).max(200).optional().nullable(),
    product_name: z.string().min(1).max(200).optional().nullable(),
    first_name: z.string().min(1, "first_name requis").max(120),
    // Nom de famille facultatif.
    last_name: z.string().max(120).optional().nullable(),
    phone: z
      .string()
      .min(6, "téléphone trop court")
      .max(20)
      .regex(/^[+0-9\s().-]+$/, "format téléphone invalide"),
    // Pays obligatoire : abréviation de 2 à 3 lettres (ex. SN, GN, AGO, GAB, BZV).
    country: z
      .string()
      .regex(/^[A-Za-z]{2,3}$/, "code pays (2 à 3 lettres)")
      .transform((c) => c.toUpperCase()),
    // Adresse et ville facultatives ; quantité obligatoire.
    address: z.string().max(300).optional().nullable(),
    city: z.string().max(120).optional().nullable(),
    quantity: z.coerce.number().int().min(1, "quantity requis").max(99),
    ip: z.string().max(60).optional().nullable(),
    user_agent: z.string().max(400).optional().nullable(),
    // Affiliate (sous-affilié) obligatoire.
    affiliate: z.string().min(1, "affiliate requis").max(255),
    sub1: z.string().max(255).optional().nullable(),
    sub2: z.string().max(255).optional().nullable(),
    sub3: z.string().max(255).optional().nullable(),
    sub4: z.string().max(255).optional().nullable(),
    sub5: z.string().max(255).optional().nullable(),
    comment: z.string().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.product_id && !data.product_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "product_id ou product_name requis",
        path: ["product_id"],
      });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;
