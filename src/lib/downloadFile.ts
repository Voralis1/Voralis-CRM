"use client";

// Téléchargement de fichier (CSV/Excel/JSON) côté client, fiable sur mobile.
//
// Le pattern classique <a download="..." href="blob:..."> + click() échoue
// silencieusement sur beaucoup de navigateurs mobiles (anciens Safari iOS,
// navigateurs in-app Instagram/Messenger/TikTok...) : soit rien ne se passe,
// soit le contenu brut s'ouvre dans l'onglet sans être enregistré. L'API Web
// Share (avec fichiers) déclenche la feuille de partage native — « Enregistrer
// dans Fichiers », WhatsApp, Mail... — et fonctionne sur la quasi-totalité des
// navigateurs mobiles modernes. On l'utilise en priorité quand disponible, et
// on retombe sur le téléchargement classique sinon (desktop notamment, où
// Web Share n'est généralement pas supporté).
export async function downloadFile(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file] });
      return;
    } catch {
      // Partage annulé par l'utilisateur ou échec de l'API : on retombe sur
      // le téléchargement classique ci-dessous plutôt que de ne rien faire.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
