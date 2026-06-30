"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SignOut from "@/components/SignOut";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Icon, type IconName } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  subtitle?: string;
  icon?: IconName;
};

function initials(email?: string | null) {
  if (!email) return "??";
  const name = email.split("@")[0];
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}


export default function Shell({
  nav,
  title,
  user,
  alert,
  children,
}: {
  nav: NavItem[];
  title: string;
  user: { email?: string | null; role?: string };
  alert?: { message: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("voralis.sidebar.collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem("voralis.sidebar.collapsed", c ? "0" : "1");
      return !c;
    });
  };

  // Onglet actif = celui dont l'href correspond le plus précisément au chemin
  // courant (match exact, ou plus long préfixe). Évite qu'un onglet « index »
  // comme /panel reste actif sur toutes ses sous-pages.
  const matches = nav.filter(
    (n) => pathname === n.href || (n.href !== "/" && pathname?.startsWith(n.href + "/"))
  );
  const activeHref = matches.length
    ? matches.reduce((a, b) => (b.href.length > a.href.length ? b : a)).href
    : null;

  const isActive = (href: string) => href === activeHref;

  const crumb = (pathname?.split("/").filter(Boolean)[0] ?? "app").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-blue">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-text transition-[width,transform] duration-200 md:static md:translate-x-0 " +
          (collapsed ? "w-[72px]" : "w-[260px]") +
          " " +
          (mobileOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-[0.16em] text-sidebar-strong">VORALIS</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-text">
                CRM
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Déplier" : "Replier"}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-text transition hover:bg-black/5 hover:text-sidebar-strong md:flex"
          >
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={collapsed ? n.label : undefined}
                className={
                  "group flex items-center gap-3 rounded-lg px-3 py-2 transition " +
                  (active
                    ? "bg-white text-ink shadow-sm"
                    : "text-sidebar-text hover:bg-black/5 hover:text-sidebar-strong")
                }
              >
                <span className={"shrink-0 " + (active ? "text-[#2563eb]" : "text-sidebar-text group-hover:text-sidebar-strong")}>
                  <Icon name={n.icon ?? "grid"} size={19} />
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-tight">{n.label}</span>
                    {n.subtitle && (
                      <span
                        className={
                          "block truncate text-[11px] leading-tight " +
                          (active ? "text-ink-muted" : "text-sidebar-text/70")
                        }
                      >
                        {n.subtitle}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bannière d'alerte */}
        {alert && !collapsed && (
          <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg bg-[#8b1a1a] px-3 py-2.5 text-white">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
            <span className="text-[11px] font-medium leading-snug">{alert.message}</span>
          </div>
        )}

        {/* Profil + déconnexion */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className={"flex items-center gap-2.5 " + (collapsed ? "justify-center" : "")}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-white">
              {initials(user.email)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-sidebar-strong">{user.email}</div>
                <div className="text-[10px] uppercase tracking-wide text-sidebar-text">{user.role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 pl-1">
              <SignOut />
            </div>
          )}
        </div>
      </aside>

      {/* Zone principale */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base">
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6"
          style={{ height: "var(--topbar-height)" }}
        >
          {/* Gauche : breadcrumb + titre */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition hover:bg-hovered md:hidden"
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                {crumb} <span className="text-ink-faint/60">/</span> {title}
              </div>
              <h1 className="truncate text-xl font-semibold leading-tight text-ink md:text-2xl">{title}</h1>
            </div>
          </div>

          {/* Droite : cluster d'indicateurs */}
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
