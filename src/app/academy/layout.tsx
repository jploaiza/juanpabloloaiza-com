import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | JPL Academy",
    default: "JPL Academy — Preparación para tu Regresión",
  },
  description:
    "Aprende sobre hipnosis, regresión a vidas pasadas y liberación de entidades espirituales con Juan Pablo Loaiza.",
};

export default function AcademyRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
