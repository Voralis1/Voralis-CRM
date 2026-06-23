import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";
import { getServerT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin" && profile.role !== "agent") redirect("/panel");

  const t = getServerT();
  const nav = [
    { href: "/admin/dashboard", label: t("nav.dashboard") },
    { href: "/admin/orders", label: t("nav.orders") },
    { href: "/admin/bulk-update", label: t("nav.bulkUpdate") },
    { href: "/admin/products", label: t("nav.products") },
    { href: "/admin/affiliates", label: t("nav.affiliates") },
    { href: "/admin/statuses", label: t("nav.statuses") },
    { href: "/admin/statistics", label: t("nav.statistics") },
  ];

  return (
    <Shell title={t("layout.adminTitle")} user={{ email: profile.email, role: profile.role }} nav={nav}>
      {children}
    </Shell>
  );
}
