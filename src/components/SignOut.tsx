"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";

export default function SignOut() {
  const router = useRouter();
  const t = useT();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return (
    <button
      className="text-sm text-slate-300 hover:text-white"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      {t("common.signOut")}
    </button>
  );
}
