import { NextResponse } from "next/server";
import { authenticateAffiliate } from "@/lib/api-auth";
import { leadSchema } from "@/lib/validation";
import { ingestLead } from "@/lib/leads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1) Authentification par token affilié
  const auth = await authenticateAffiliate(req);
  if ("error" in auth)
    return NextResponse.json(
      { success: false, error_code: "AUTH", message: auth.error },
      { status: auth.code }
    );

  // 2) Validation du payload
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error_code: "BAD_JSON", message: "Corps JSON invalide" },
      { status: 400 }
    );
  }
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error_code: "VALIDATION",
        message: parsed.error.errors[0]?.message ?? "Données invalides",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // 3) Ingestion (offre + déduplication + insertion), logique partagée
  const result = await ingestLead(auth.affiliate.id, parsed.data);
  if (!result.ok)
    return NextResponse.json(
      { success: false, error_code: result.error_code, message: result.message },
      { status: result.code }
    );

  return NextResponse.json(
    { success: true, lead_id: result.lead_id, status: result.status, message: "Lead reçu avec succès" },
    { status: 201 }
  );
}
