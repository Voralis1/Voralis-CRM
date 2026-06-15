import { createClient } from "@supabase/supabase-js";

// Client SERVICE ROLE : contourne la RLS. À n'utiliser QUE côté serveur
// (routes API publiques d'intake, dispatcher de postbacks). Jamais exposé au client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
