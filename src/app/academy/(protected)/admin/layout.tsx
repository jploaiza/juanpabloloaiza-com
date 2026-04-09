/**
 * Admin layout — sobreescribe las fuentes del sitio principal
 * por Plus Jakarta Sans: sans-serif moderna con antialiasing perfecto
 * para texto pequeño sobre fondo oscuro.
 *
 * Solo aplica a /academy/admin/* sin tocar componentes ni páginas.
 */

import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-admin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={jakartaSans.variable}
      style={
        {
          "--font-cinzel": "var(--font-admin)",
          "--font-crimson": "var(--font-admin)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
