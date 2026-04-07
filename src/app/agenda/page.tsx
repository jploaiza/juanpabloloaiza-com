import type { Metadata } from "next";
import AgendaContent from "./AgendaContent";

export const metadata: Metadata = {
  title: "Agenda de Sesión — Juan Pablo Loaiza",
  robots: { index: false, follow: false },
};

export default function AgendaPage() {
  return <AgendaContent />;
}
