import Link from "next/link";
import SignOut from "@/components/SignOut";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type NavItem = { href: string; label: string };

export default function Shell({
  nav,
  title,
  user,
  children,
}: {
  nav: NavItem[];
  title: string;
  user: { email?: string | null; role?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto bg-brand-deep px-4 py-6 text-slate-200">
        <div className="mb-8 px-2">
          <div className="text-xl font-extrabold tracking-[0.18em] text-white">VORALIS</div>
          <div className="text-[11px] uppercase tracking-wide text-brand-light">CRM</div>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 px-3 text-xs text-slate-400">
            {user.email}
            <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">
              {user.role}
            </span>
          </div>
          <div className="px-3"><SignOut /></div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-[#fbfcfb]">
        <header className="shrink-0 border-b border-brand-line bg-white px-8 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-brand-dark">{title}</h1>
          <LanguageSwitcher />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
