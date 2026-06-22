import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin" && profile.role !== "agent") redirect("/panel");

  const nav = [
    { href: "/admin/dashboard", label: "Tableau de bord" },
    { href: "/admin/orders", label: "Traitement des leads" },
    { href: "/admin/bulk-update", label: "Mise à jour" },
    { href: "/admin/products", label: "Gestion de produits" },
    { href: "/admin/affiliates", label: "Affiliés" },
    { href: "/admin/statuses", label: "Gestion des status" },
    { href: "/admin/statistics", label: "Statistiques" },
  ];

  return (
    <Shell title="Back-office VORALIS" user={{ email: profile.email, role: profile.role }} nav={nav}>
      {children}
    </Shell>
  );
}
