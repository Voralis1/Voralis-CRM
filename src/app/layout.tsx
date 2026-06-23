import "./globals.css";
import type { Metadata } from "next";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "VORALIS CRM",
  description: "CRM interne VORALIS — gestion des leads affiliés COD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
