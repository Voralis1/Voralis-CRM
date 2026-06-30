"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";
import { Icon } from "@/components/icons";

export default function SignOut() {
  const router = useRouter();
  const t = useT();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return (
    <button
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#f87171] transition hover:text-[#fca5a5]"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <Icon name="logout" size={15} />
      {t("common.signOut")}
    </button>
  );
}
