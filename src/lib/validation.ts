import { z } from "zod";

export const SUPPORTED_COUNTRIES = ["AO", "ML", "SN", "CI", "GN", "GA", "CG", "MA"] as const;

export const leadSchema = z.object({
  offer_id: z.string().min(1, "offer_id requis"),
  first_name: z.string().min(1, "first_name requis").max(120),
  last_name: z.string().max(120).optional().nullable(),
  phone: z
    .string()
    .min(6, "téléphone trop court")
    .max(20)
    .regex(/^[+0-9\s().-]+$/, "format téléphone invalide"),
  country: z.enum(SUPPORTED_COUNTRIES, {
    errorMap: () => ({ message: "pays non couvert" }),
  }),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  ip: z.string().max(60).optional().nullable(),
  user_agent: z.string().max(400).optional().nullable(),
  sub1: z.string().max(255).optional().nullable(),
  sub2: z.string().max(255).optional().nullable(),
  sub3: z.string().max(255).optional().nullable(),
  sub4: z.string().max(255).optional().nullable(),
  sub5: z.string().max(255).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
});

export type LeadInput = z.infer<typeof leadSchema>;
