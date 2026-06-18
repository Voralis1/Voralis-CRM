import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin" || profile.role === "agent") redirect("/admin/orders");

  return (
    <Shell
      title="Espace Webmaster"
      user={{ email: profile.email, role: profile.role }}
      nav={[
        { href: "/panel", label: "Tableau de bord" },
        { href: "/panel/leads", label: "Mes leads" },
        { href: "/panel/products", label: "Produits" },
        { href: "/panel/settings", label: "API & Postback" },
        { href: "/panel/account", label: "Mon compte" },
      ]}
    >
      {children}
    </Shell>
  );
}
