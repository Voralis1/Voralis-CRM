import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";
import { getServerT } from "@/i18n/server";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin" || profile.role === "agent") redirect("/admin/orders");

  const t = getServerT();
  return (
    <Shell
      title={t("layout.panelTitle")}
      user={{ email: profile.email, role: profile.role }}
      nav={[
        { href: "/panel", label: t("nav.panelHome") },
        { href: "/panel/leads", label: t("nav.myLeads") },
        { href: "/panel/products", label: t("nav.panelProducts") },
        { href: "/panel/settings", label: t("nav.apiPostback") },
        { href: "/panel/account", label: t("nav.account") },
      ]}
    >
      {children}
    </Shell>
  );
}
