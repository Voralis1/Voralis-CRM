import { NextResponse } from "next/server";
import { dispatchPending } from "@/lib/postback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Déclencheur du dispatcher de postbacks.
// Protégé par CRON_SECRET : header "x-cron-secret" ou "?secret=".
// À appeler chaque minute (Vercel Cron, pg_cron+pg_net, ou n8n).
async function handle(req: Request) {
  const url = new URL(req.url);
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const provided =
    req.headers.get("x-cron-secret") ||
    url.searchParams.get("secret") ||
    bearer ||
    "";
  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await dispatchPending(50);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return handle(req);
}
export async function GET(req: Request) {
  return handle(req);
}
