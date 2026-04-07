import type { Metadata } from "next";
import FormularioContent from "./FormularioContent";

export const metadata: Metadata = {
  title: "Formulario de Admisión — Juan Pablo Loaiza",
  robots: { index: false, follow: false },
};

export default function FormularioPage() {
  return <FormularioContent />;
}
