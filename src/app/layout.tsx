import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VORALIS CRM",
  description: "CRM interne VORALIS — gestion des leads affiliés COD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
