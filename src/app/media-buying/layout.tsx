import { redirect } from "next/navigation";
import { getProfile, homeForRole } from "@/lib/auth";
import Shell, { type NavItem } from "@/components/Shell";
import { getServerT } from "@/i18n/server";

export default async function MediaBuyingLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Réservé aux media buyers (et admins pour supervision).
  if (profile.role !== "media_buyer" && profile.role !== "admin") {
    redirect(homeForRole(profile.role));
  }

  const t = getServerT();
  const nav: NavItem[] = [
    { href: "/media-buying", label: t("nav.dashboard"), subtitle: t("navSub.mbDashboard"), icon: "grid" },
    { href: "/media-buying/orders", label: t("nav.myOrders"), subtitle: t("navSub.myOrders"), icon: "list" },
    { href: "/media-buying/spend", label: t("nav.adSpend"), subtitle: t("navSub.adSpend"), icon: "wallet" },
    { href: "/media-buying/results", label: t("nav.results"), subtitle: t("navSub.results"), icon: "chart" },
  ];

  return (
    <Shell title={t("layout.mbTitle")} user={{ email: profile.email, role: profile.role }} nav={nav}>
      {children}
    </Shell>
  );
}
