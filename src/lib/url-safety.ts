import { promises as dns } from "dns";
import { isIPv4, isIPv6 } from "net";

// Empêche un affilié de configurer un postback_url pointant vers une
// adresse interne : dispatchPending() fait un fetch() côté serveur sur
// cette URL avec un contexte réseau privilégié (risque SSRF).

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    a >= 224 || // multicast (224-239) + réservé (240-255)
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) // CGNAT
  );
}

function ipv6IsPrivate(ip: string): boolean {
  const low = ip.toLowerCase();
  if (low === "::1" || low === "::") return true;
  if (low.startsWith("fe80:") || low.startsWith("fec0:")) return true; // link-local
  if (low.startsWith("fc") || low.startsWith("fd")) return true; // ULA fc00::/7
  const mapped = low.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // v4 mappée dans v6
  if (mapped) return ipv4IsPrivate(mapped[1]);
  return false;
}

function ipIsPrivate(ip: string): boolean {
  if (isIPv4(ip)) return ipv4IsPrivate(ip);
  if (isIPv6(ip)) return ipv6IsPrivate(ip);
  return true; // format inattendu -> refusé par défaut
}

export type UrlSafetyResult = { ok: true } | { ok: false; reason: string };

export async function assertSafePostbackUrl(raw: string): Promise<UrlSafetyResult> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "URL invalide" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Seuls les liens http:// et https:// sont autorisés" };
  }

  const hostname = url.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return { ok: false, reason: "Les adresses locales ne sont pas autorisées" };
  }

  if (isIPv4(hostname) || isIPv6(hostname)) {
    if (ipIsPrivate(hostname)) return { ok: false, reason: "Les adresses IP privées/internes ne sont pas autorisées" };
    return { ok: true };
  }

  // Résolution DNS pour bloquer les domaines qui pointent vers une IP
  // interne (protection contre le DNS rebinding).
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return { ok: false, reason: "Nom de domaine introuvable" };
  }
  if (addresses.length === 0 || addresses.some((a) => ipIsPrivate(a.address))) {
    return { ok: false, reason: "Ce domaine pointe vers une adresse interne non autorisée" };
  }

  return { ok: true };
}
