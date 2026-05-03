import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Políticas de Servicio | Juan Pablo Loaiza",
  description: "Políticas de servicio, cancelación, reembolsos y privacidad de Juan Pablo Loaiza — Hipnosis Terapéutica de Regresión a Vidas Pasadas.",
  alternates: { canonical: "https://juanpabloloaiza.com/politicas-de-servicio" },
};

const sections = [
  {
    title: "Declaración de aceptación",
    content: `Al firmar este documento, el cliente declara haber leído, comprendido y aceptado en su totalidad las presentes políticas de servicio, las cuales constituyen un acuerdo vinculante entre las partes. La firma digital tiene el mismo valor legal que una firma manuscrita conforme a la Ley N°19.799 sobre Documentos Electrónicos (Chile) y legislación equivalente en el país de residencia del cliente.`,
  },
  {
    title: "1. Duración y validez de los packs de sesiones",
    content: `Una vez iniciado el proceso terapéutico, los packs de 3 sesiones tienen una validez de 4 semanas, los packs de 5 sesiones tienen una validez de 7 semanas, y el pack de 8 sesiones tiene una validez de 11 semanas, todos contados desde la fecha de compra y pago efectivo. Es importante tener en cuenta que una vez transcurrido el plazo establecido, las sesiones no tomadas debido a situaciones personales del cliente/paciente se perderán sin excepción ni compensación. En ese caso, el cliente deberá adquirir las sesiones adicionales necesarias para completar el proceso terapéutico. El vencimiento del plazo opera de manera automática, sin necesidad de notificación previa por parte del terapeuta.`,
  },
  {
    title: "2. Contenido de los packs con descuento",
    content: `Las sesiones incluidas en los packs con descuento corresponden a sesiones terapéuticas de dos horas cada una. Si, al finalizar la cantidad de terapias adquiridas a través del pack que el cliente ha elegido, el paciente necesita sesiones adicionales para completar su proceso terapéutico, estas deben ser adquiridas por separado, y su valor será aparte del pack ya adquirido. El terapeuta no garantiza resultados terapéuticos específicos ni un número determinado de sesiones para completar el proceso, ya que esto depende exclusivamente de la evolución individual de cada cliente.`,
  },
  {
    title: "3. Cláusula de no devolución de sesiones no utilizadas",
    content: `En el caso de que el paciente no utilice la cantidad completa de sesiones durante su proceso, las sesiones restantes del pack no se devolverán. Sin embargo, se invitará al paciente a utilizar estas sesiones restantes para tratar otros temas o se podrá cambiar por sesiones de Tarot Terapéutico Evolutivo, ya sea para el paciente mismo o para quien este estime conveniente (como un regalo a otros). El cliente declara conocer y aceptar esta condición como requisito esencial para acceder a los precios de pack con descuento, y reconoce que dicha condición fue informada con anterioridad a la compra. En caso de no llegar a un acuerdo respecto al uso de las sesiones restantes, las sesiones tomadas serán consideradas como sesiones individuales a precio completo. El valor restante del pack, después de este ajuste, podría ser devuelto únicamente en casos excepcionales, donde el paciente haya completado su proceso terapéutico de forma exitosa y cumpliendo con todas y cada una de las políticas de servicio aquí expuestas.`,
  },
  {
    title: "4. Reagendamiento de sesiones",
    content: `En caso de necesidad o emergencia, es posible reagendar una sesión con al menos 2 horas de antelación. Si se cumple este requisito, el reagendamiento no tendrá ningún costo adicional, siempre y cuando la sesión se programe dentro del plazo de validez establecido en el punto 1. El reagendamiento debe ser solicitado por el cliente a través de los canales oficiales habilitados para ese efecto. No se considerará válido ningún aviso realizado por medios informales o a terceros que no sean el terapeuta o su equipo directo.`,
  },
  {
    title: "5. Disponibilidad de agenda",
    content: `La agenda está abierta para todos los pacientes, por lo tanto, los espacios disponibles para las sesiones se asignarán por orden de llegada. Si has realizado un agendamiento y necesitas modificarlo, podrás hacerlo siempre y cuando haya espacios disponibles en la agenda. Todos los pacientes tendrán asegurado al menos un cupo a la semana para su sesión. Sin embargo, no podemos garantizar que los reagendamientos se puedan realizar dentro de la misma semana. La disponibilidad de agenda no constituye una obligación de horario específico por parte del terapeuta.`,
  },
  {
    title: "6. Responsabilidad del paciente en el proceso terapéutico",
    content: `Es responsabilidad exclusiva del paciente tomar las sesiones programadas cada semana y gestionar activamente su agenda dentro de los plazos de validez. No es responsabilidad del terapeuta ni de su equipo recordar o insistir en que los pacientes realicen su proceso terapéutico en el tiempo establecido. Aunque se realice un seguimiento continuo, debido a la alta demanda, no podemos garantizar que todos los pacientes sean contactados a tiempo. Por lo tanto, sigue siendo responsabilidad del paciente solicitar y agendar sus sesiones. Si el paciente no agenda ni toma la sesión y esta no se realiza en el tiempo correspondiente, la responsabilidad recae única y exclusivamente en el paciente, sin que ello genere derecho a reembolso, extensión de plazo ni compensación de ningún tipo.`,
  },
  {
    title: "7. Espacio mínimo entre sesiones y recomendación de continuidad",
    content: `Cada sesión debe tener un espacio mínimo de cinco días hasta la siguiente sesión. Se recomienda, preferiblemente, espacios de siete días para un mejor aprovechamiento del proceso terapéutico. No se recomienda detener o pausar el proceso terapéutico por más de dos semanas, ya que esto puede diluir los avances logrados hasta el momento. En caso de interrupción por más de dos semanas, será necesario programar una sesión extra con un costo adicional equivalente al valor de 1 sesión individual para recapitular lo trabajado, sanar lo necesario y continuar con el proceso. Esta sesión adicional deberá ser pagada antes de su realización y no está incluida en ningún pack previamente adquirido.`,
  },
  {
    title: "8. Posibilidad de entrar en estado hipnótico",
    content: `La hipnosis responde a los estímulos y estados emocionales del paciente. El compromiso del terapeuta es realizar todos los esfuerzos profesionales a su alcance para ayudar al paciente a alcanzar un estado de calma y paz que facilite la entrada en hipnosis de manera adecuada. Sin embargo, el cliente declara comprender y aceptar que la hipnosis es un proceso propio de cada individuo, y que cada persona puede decidir consciente o inconscientemente si puede o quiere entrar en ese estado. Por lo tanto, el terapeuta no garantiza ni puede garantizar que el paciente pueda entrar en un estado hipnótico profundo, y la imposibilidad de lograrlo no constituirá causal de reembolso ni incumplimiento de servicio.`,
  },
  {
    title: "9. Equipamiento y condiciones necesarias para las sesiones",
    content: `Es responsabilidad exclusiva del paciente contar con el equipamiento adecuado para realizar las sesiones. Se requiere disponer de una cámara web, audífonos con cable y micrófono en funcionamiento (se recomienda evitar los audífonos inalámbricos), una conexión a Internet estable y un espacio físico adecuado (tranquilo, sin ruidos molestos, sin presencia de animales, mascotas o familiares). No se llevará a cabo ninguna sesión en la que esté presente otra persona además del paciente. El incumplimiento de cualquiera de estos requisitos será motivo de cancelación inmediata de la sesión, la cual se contabilizará como sesión realizada para efectos del pack. Adicionalmente, se aplicará un recargo del 20% del valor de una sesión individual por cancelación o reagendamiento de última hora, el cual deberá ser pagado antes de la siguiente sesión. El terapeuta no asume responsabilidad por problemas técnicos derivados del equipamiento o conexión del cliente.`,
  },
  {
    title: "10. Política de no devolución y cancelaciones tardías",
    content: `Una vez iniciado el proceso terapéutico, no se realizarán devoluciones de sesiones no tomadas por el cliente, bajo ninguna circunstancia, salvo las excepciones expresamente indicadas en este documento. Si el paciente decide no continuar con el proceso, las sesiones restantes no serán reembolsadas. Cualquier cancelación o reagendamiento realizado fuera de los plazos establecidos estará sujeto a un recargo del 20% del valor de una sesión individual. Este recargo deberá ser pagado antes de la siguiente sesión programada. El no pago del recargo dentro de las 48 horas siguientes a su generación facultará al terapeuta para suspender el proceso terapéutico hasta que la deuda sea saldada, sin que ello implique extensión del plazo de validez del pack.`,
  },
  {
    title: "11. Finalización del proceso terapéutico por decisión del terapeuta",
    content: `El terapeuta se reserva el derecho de finalizar un proceso terapéutico en determinadas situaciones y con las justificaciones necesarias, sin que esto constituya incumplimiento contractual de su parte. En caso de que esto suceda, podrían aplicarse las siguientes condiciones:
A) Devolución parcial de lo abonado: Si el cliente ha utilizado menos sesiones de las establecidas en el pack adquirido, se considerarán estas sesiones como sesiones individuales con valor normal, eliminando el descuento de pack. En este caso, el terapeuta podría decidir devolver el monto correspondiente a las sesiones no tomadas, una vez aplicado dicho ajuste.
B) No devolución: En casos de faltas reiteradas o cancelaciones sin motivo aparente, no se realizarán devoluciones. Se considera que estas acciones interrumpen el proceso terapéutico y dificultan su continuidad y efectividad. Se entenderá por "reiteradas" dos o más incidencias del mismo tipo dentro del período de validez del pack. El terapeuta no estará obligado a realizar devoluciones en tales casos.
Las causales que justifican la finalización del proceso por decisión del terapeuta incluyen, sin limitarse a:
— Incumplimiento reiterado de las políticas y normas establecidas por el terapeuta.
— Conducta inapropiada, irrespetuosa o violenta por parte del cliente, ya sea verbal, escrita o de cualquier otra naturaleza.
— Falta de compromiso o participación activa del cliente en el proceso terapéutico.
— Indicaciones o recomendaciones médicas que contraindiquen la continuación de las sesiones.
— Situaciones imprevistas que dificulten o impidan la realización de las sesiones de manera efectiva.
— Utilización o abuso de sustancias no permitidas, como drogas ilegales o legales, o alcohol, antes o durante las sesiones, lo cual produce un estado mental alterado que no permite al paciente tomar decisiones conscientes ni entrar en hipnosis de manera adecuada.
La determinación de si se configura alguna de estas causales queda a criterio exclusivo del terapeuta, quien evaluará cada situación de manera individual. En estos casos, la devolución parcial, si corresponde, se realizará según los criterios establecidos por el terapeuta en función de las circunstancias particulares de cada caso.`,
  },
  {
    title: "12. Jurisdicción y ley aplicable",
    content: `Las presentes políticas de servicio se rigen por las leyes de la República de Chile, específicamente la Ley N°19.496 sobre Protección de los Derechos de los Consumidores y sus modificaciones vigentes. Para clientes ubicados en otros países, estas políticas constituyen el acuerdo íntegro entre las partes, y cualquier controversia que no pueda resolverse de mutuo acuerdo será sometida a la jurisdicción de los tribunales ordinarios de justicia de la ciudad de Santiago de Chile, renunciando el cliente expresamente a cualquier otro fuero que pudiera corresponderle.`,
  },
  {
    title: "13. Tratamiento de datos personales",
    content: `El cliente autoriza expresamente al terapeuta a almacenar y tratar sus datos personales con la finalidad exclusiva de gestionar el proceso terapéutico, incluyendo nombre, datos de contacto, historial de sesiones y medios de pago. Estos datos no serán compartidos con terceros salvo obligación legal. El cliente podrá solicitar en cualquier momento la eliminación de sus datos, lo cual implicará la finalización del proceso terapéutico y no generará derecho a reembolso. Lo anterior se enmarca en la Ley N°19.628 sobre Protección de la Vida Privada (Chile) y legislación equivalente aplicable según el país de residencia del cliente.`,
  },
];

const disclaimer = [
  {
    title: "Naturaleza del servicio",
    content: `Al reservar y participar en sesiones de mentoría, coaching espiritual, hipnosis, regresión en la vida presente, regresión a vidas pasadas, regresión transgeneracional, liberación de entidades espirituales (SRT) o tarot terapéutico evolutivo con Juan Pablo Loaiza, el cliente comprende y acepta expresamente que Juan Pablo Loaiza no es médico, psicólogo, psiquiatra, abogado ni contador, y que por tanto no está habilitado para ofrecer asesoramiento médico, psicológico, legal ni financiero de ningún tipo. Todos los servicios ofrecidos son de naturaleza exclusivamente espiritual y de desarrollo personal.
Las orientaciones proporcionadas durante las sesiones tienen el propósito de enriquecer la vida espiritual del cliente y bajo ninguna circunstancia deben ser consideradas como sustituto de consultas con profesionales médicos, psicológicos, psiquiátricos, legales o financieros debidamente habilitados.`,
  },
  {
    title: "Complementariedad con tratamientos médicos",
    content: `Las terapias ofrecidas por Juan Pablo Loaiza son de carácter complementario y no constituyen una alternativa ni reemplazo a tratamientos médicos convencionales. El cliente se compromete a continuar con sus tratamientos médicos alopáticos, medicamentos e instrucciones médicas vigentes. Cualquier decisión relativa a modificar, reducir o suspender tratamientos médicos debe ser tomada exclusivamente bajo la supervisión y aprobación de profesionales de la salud calificados. Juan Pablo Loaiza no asume ninguna responsabilidad por decisiones médicas adoptadas por el cliente durante o después del proceso terapéutico.`,
  },
  {
    title: "Alcance y limitaciones del servicio",
    content: `Las sesiones buscan ofrecer perspectivas espirituales y apoyo en el camino personal del cliente. En ningún caso incluyen, implican ni deben interpretarse como:
— Diagnóstico, tratamiento o seguimiento de condiciones médicas o psiquiátricas.
— Asesoramiento psicológico o psicoterapéutico.
— Consejo legal, tributario o financiero.
— Prescripción o recomendación de medicamentos o suplementos.
Juan Pablo Loaiza no responderá preguntas de carácter médico, no emitirá diagnósticos y no tratará condiciones de salud física ni mental. Si el cliente presenta o sospecha una condición de salud mental, se le recomienda expresamente consultar con un profesional de la salud antes de iniciar o continuar el proceso terapéutico.`,
  },
  {
    title: "Asunción de responsabilidad por parte del cliente",
    content: `El cliente reconoce y acepta que cualquier decisión adoptada con base en las sesiones realizadas es de su exclusiva responsabilidad. Juan Pablo Loaiza no será responsable, en ningún caso, de daños directos, indirectos, materiales, morales o de cualquier otra naturaleza que pudieran derivarse del uso de los servicios contratados, incluyendo pero no limitándose a: decisiones personales, laborales, relacionales, médicas o financieras tomadas por el cliente como consecuencia de las sesiones.
Esta limitación de responsabilidad es válida en la máxima medida permitida por la legislación aplicable en el país de residencia del cliente.`,
  },
  {
    title: "Derecho a rechazar o discontinuar el servicio",
    content: `Juan Pablo Loaiza se reserva el derecho de rechazar o discontinuar la prestación del servicio a cualquier persona, en cualquier momento, con o sin expresión de causa, sin que ello genere obligación de indemnización, salvo lo establecido en las Políticas de Servicio vigentes respecto a devoluciones parciales cuando corresponda.`,
  },
  {
    title: "Poblaciones con consideración especial",
    content: `Los servicios ofrecidos no están diseñados para personas que se encuentren en crisis psiquiátrica aguda, bajo tratamiento activo por psicosis, esquizofrenia u otras condiciones disociativas graves, ni para menores de 18 años sin autorización expresa de su representante legal. El cliente declara no encontrarse en ninguna de estas situaciones al momento de contratar el servicio. Si durante el proceso terapéutico el terapeuta identificara indicios de alguna de estas condiciones, se reserva el derecho de suspender las sesiones y derivar al cliente a un profesional de salud competente.`,
  },
];

export default function PoliticasPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a1628] pt-32 pb-20">
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
            <div key={i} className="relative bg-[#16213e] border border-[#C5A059]/20 p-8">
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

        {/* Disclaimer */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-20 mb-10">
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-semibold font-cinzel">
            Limitación de responsabilidad
          </span>
          <h2 className="text-3xl md:text-4xl text-white mt-4 mb-6 font-cinzel font-bold leading-tight">
            Descargo de Responsabilidad
          </h2>
          <p className="font-crimson text-gray-400 text-lg">
            Juan Pablo Loaiza — Servicios Espirituales y Terapéuticos · Versión 2026
          </p>
          <div className="w-16 h-[1px] bg-[#C5A059] mt-6" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          {disclaimer.map((section, i) => (
            <div key={i} className="relative bg-[#16213e] border border-[#C5A059]/20 p-8">
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
