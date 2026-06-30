import { redirect } from "next/navigation";
import { getProfile, homeForRole } from "@/lib/auth";
import Shell, { type NavItem } from "@/components/Shell";
import { getServerT } from "@/i18n/server";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Panel réservé aux affiliés.
  if (profile.role !== "affiliate") redirect(homeForRole(profile.role));

  const t = getServerT();
  const nav: NavItem[] = [
    { href: "/panel", label: t("nav.panelHome"), subtitle: t("navSub.panelHome"), icon: "grid" },
    { href: "/panel/leads", label: t("nav.myLeads"), subtitle: t("navSub.myLeads"), icon: "list" },
    { href: "/panel/products", label: t("nav.panelProducts"), subtitle: t("navSub.panelProducts"), icon: "box" },
    { href: "/panel/settings", label: t("nav.apiPostback"), subtitle: t("navSub.apiPostback"), icon: "key" },
    { href: "/panel/account", label: t("nav.account"), subtitle: t("navSub.account"), icon: "user" },
  ];
  return (
    <Shell
      title={t("layout.panelTitle")}
      user={{ email: profile.email, role: profile.role }}
      nav={nav}
    >
      {children}
    </Shell>
  );
}
