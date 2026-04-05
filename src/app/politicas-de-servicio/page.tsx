import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Políticas de Servicio | Juan Pablo Loaiza",
  description: "Políticas de servicio, cancelación, reembolsos y privacidad de Juan Pablo Loaiza — Hipnoterapia de Regresión a Vidas Pasadas.",
  alternates: { canonical: "https://juanpabloloaiza.com/politicas-de-servicio" },
};

const sections = [
  {
    title: "1. Naturaleza del Servicio",
    content: `La hipnoterapia de regresión a vidas pasadas y la terapia de liberación de entidades espirituales son servicios terapéuticos complementarios. No reemplazan ningún tratamiento médico, psiquiátrico o psicológico convencional previamente establecido.

Juan Pablo Loaiza es un terapeuta holístico certificado internacionalmente. Los resultados obtenidos en las sesiones pueden variar según cada persona y no se garantiza ningún resultado específico.`,
  },
  {
    title: "2. Proceso de Admisión",
    content: `El acceso al proceso terapéutico comienza con una entrevista preliminar gratuita vía Zoom, en la que se evaluará si el servicio es adecuado para el cliente.

Las únicas contraindicaciones absolutas son:
- Diagnóstico de enfermedad mental bajo tratamiento farmacológico activo
- Menores de edad (aunque se puede trabajar en conjunto con padre o madre)

Al confirmar la entrevista preliminar, el cliente acepta haber leído y comprendido las presentes políticas.`,
  },
  {
    title: "3. Sesiones y Pagos",
    content: `Las sesiones se realizan de forma individual vía Zoom. El proceso terapéutico completo comprende hasta 10 sesiones, divididas en tres etapas: Descubrir, Entender y Limpiar.

El pago se realiza antes de cada sesión o por paquete de sesiones según el acuerdo establecido. Los precios vigentes se informan durante la entrevista preliminar y pueden ser actualizados sin previo aviso.`,
  },
  {
    title: "4. Política de Cancelación y Reprogramación",
    content: `Para cancelar o reprogramar una sesión, se requiere aviso con al menos 24 horas de anticipación a través de WhatsApp (+56 9 6208 1884) o correo electrónico (contacto@juanpabloloaiza.com).

- Cancelaciones con más de 24 horas de anticipación: reprogramación sin costo.
- Cancelaciones con menos de 24 horas de anticipación: la sesión se considera realizada y no es reembolsable.
- Inasistencia sin aviso previo: la sesión se pierde sin reembolso.

En caso de emergencia debidamente justificada, se evaluará caso a caso.`,
  },
  {
    title: "5. Política de Reembolsos",
    content: `Una vez iniciado el proceso terapéutico, los pagos realizados no son reembolsables, ya que se reserva tiempo exclusivo para cada cliente.

Si por alguna razón Juan Pablo Loaiza debe cancelar una sesión, esta será reprogramada sin costo adicional en la fecha más próxima disponible.`,
  },
  {
    title: "6. Grabación de Sesiones",
    content: `Todas las sesiones se realizan vía Zoom y se graban en audio y video, con el consentimiento del cliente. Las grabaciones son de uso exclusivo del cliente y del terapeuta para fines del proceso terapéutico.

Si deseas recibir tu grabación, puedes solicitarla por WhatsApp o correo electrónico tras finalizar la sesión.`,
  },
  {
    title: "7. Privacidad y Confidencialidad",
    content: `Toda la información compartida durante las sesiones es estrictamente confidencial. Juan Pablo Loaiza no comparte información personal ni el contenido de las sesiones con terceros, salvo en los casos exigidos por ley.

Los datos de contacto (nombre, correo, teléfono) se utilizan únicamente para coordinar el proceso terapéutico y no serán cedidos a terceros con fines comerciales.`,
  },
  {
    title: "8. Responsabilidad del Cliente",
    content: `El cliente es responsable de:
- Contar con una conexión a internet estable para las sesiones vía Zoom.
- Estar en un lugar privado, silencioso y cómodo durante la sesión.
- Informar al terapeuta sobre cualquier condición médica o psicológica relevante antes de iniciar el proceso.
- No conducir ni operar maquinaria pesada inmediatamente después de una sesión de hipnoterapia.`,
  },
  {
    title: "9. Modificaciones a las Políticas",
    content: `Juan Pablo Loaiza se reserva el derecho de actualizar estas políticas en cualquier momento. Las modificaciones entran en vigor desde su publicación en este sitio web. Se recomienda revisar esta página periódicamente.`,
  },
  {
    title: "10. Contacto",
    content: `Para cualquier consulta relacionada con estas políticas, puedes comunicarte a través de:

- WhatsApp: +56 9 6208 1884
- Correo: contacto@juanpabloloaiza.com
- Sitio web: juanpabloloaiza.com`,
  },
];

export default function PoliticasPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#020617] pt-32 pb-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">
            Transparencia y Confianza
          </span>
          <h1 className="text-4xl md:text-5xl text-white mt-4 mb-6 font-cinzel font-bold leading-tight">
            Políticas de Servicio
          </h1>
          <p className="font-crimson text-xl text-gray-300 leading-relaxed max-w-2xl">
            Antes de comenzar tu proceso terapéutico, te invito a leer estas políticas para que nuestra relación sea clara y transparente desde el inicio.
          </p>
          <div className="w-16 h-[1px] bg-[#C5A059] mt-6" />
          <p className="text-gray-500 font-crimson text-sm mt-4">
            Última actualización: abril 2026
          </p>
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          {sections.map((section, i) => (
            <div key={i} className="relative bg-[#0f172a] border border-[#C5A059]/20 p-8">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C5A059]/50" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/50" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#C5A059]/50" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C5A059]/50" />

              <h2 className="text-xl font-cinzel text-[#C5A059] mb-4 font-semibold">
                {section.title}
              </h2>
              <div className="font-crimson text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 text-center">
          <p className="font-crimson text-gray-400 text-lg mb-6">
            ¿Tienes alguna pregunta sobre estas políticas?
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=56962081884"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            Contáctame por WhatsApp
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
