import type { Metadata } from "next";
import EntrevistaContent from "./EntrevistaContent";

export const metadata: Metadata = {
  title: "Agenda de Entrevista — Juan Pablo Loaiza",
  robots: { index: false, follow: false },
};

export default function EntrevistaPage() {
  return <EntrevistaContent />;
}
