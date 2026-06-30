import { Icon, type IconName } from "@/components/icons";

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "send", title: "Leads COD en temps réel", desc: "Réception et suivi instantané de vos commandes." },
  { icon: "refresh", title: "Postbacks automatiques", desc: "Chaque statut renvoyé vers votre tracker." },
  { icon: "chart", title: "Stats & payout par affilié", desc: "Performance et commissions en un coup d'œil." },
];

// Mise en page d'authentification : panneau visuel à gauche, formulaire à droite.
export default function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base">
      {/* Panneau visuel (gauche) */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(140deg, #4f46e5 0%, #5b4fcf 38%, #1a1d27 100%)" }}
      >
        {/* Cercles décoratifs flous */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#22c55e]/15 blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <div className="text-2xl font-extrabold tracking-[0.2em]">VORALIS</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">COD Enterprise</div>
        </div>

        {/* Accroche + atouts */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            La plateforme CRM des réseaux d'affiliés COD.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Centralisez l'acquisition, la confirmation, la logistique et le cash — d'un bout à l'autre.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon name={f.icon} size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-white/65">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pied */}
        <div className="relative text-xs text-white/50">
          © {"VORALIS"} — Accès réservé aux partenaires.
        </div>
      </div>

      {/* Formulaire (droite) */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
