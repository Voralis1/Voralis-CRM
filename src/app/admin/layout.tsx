import { redirect } from "next/navigation";
import { getProfile, homeForRole } from "@/lib/auth";
import Shell, { type NavItem } from "@/components/Shell";
import { getServerT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Back-office réservé aux admins (le rôle « agent » n'existe plus).
  if (profile.role !== "admin") redirect(homeForRole(profile.role));

  const t = getServerT();
  const nav: NavItem[] = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), subtitle: t("navSub.dashboard"), icon: "grid" },
    { href: "/admin/orders", label: t("nav.orders"), subtitle: t("navSub.orders"), icon: "list" },
    { href: "/admin/orders-processing", label: t("nav.ordersProcessing"), subtitle: t("navSub.ordersProcessing"), icon: "download" },
    { href: "/admin/mediabuyers-orders", label: t("nav.mbOrders"), subtitle: t("navSub.mbOrders"), icon: "truck" },
    { href: "/admin/bulk-update", label: t("nav.bulkUpdate"), subtitle: t("navSub.bulkUpdate"), icon: "edit" },
    { href: "/admin/products", label: t("nav.products"), subtitle: t("navSub.products"), icon: "box" },
    { href: "/admin/affiliates", label: t("nav.affiliates"), subtitle: t("navSub.affiliates"), icon: "users" },
    { href: "/admin/statuses", label: t("nav.statuses"), subtitle: t("navSub.statuses"), icon: "tag" },
    { href: "/admin/statistics", label: t("nav.statistics"), subtitle: t("navSub.statistics"), icon: "chart" },
    { href: "/admin/payout", label: t("nav.payout"), subtitle: t("navSub.payout"), icon: "wallet" },
  ];

  return (
    <Shell
      title={t("layout.adminTitle")}
      user={{ email: profile.email, role: profile.role }}
      nav={nav}
    >
      {children}
    </Shell>
  );
}
