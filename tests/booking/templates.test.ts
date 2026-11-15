import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/lib/templates";
import { buildBookingTimeVars } from "@/lib/booking-time";

// Textos reales de las plantillas guardadas en producción.
const WA = "🕐 {{time}} (hora Chile)\n⏱ {{duration}} minutos";
const WA_1H = "tu sesión comienza a las {{time}} (Chile).";
const EMAIL_LABEL = '<p>Fecha y hora (Chile)</p><p>{{date_long}} — {{time}}</p>';
const SUBJECT_1H = "Tu {{type_label}} es en 1 hora — {{time}} (Chile)";

describe("plantillas con '(Chile)' fijo", () => {
  it("paciente en Chile: el texto queda tal cual", () => {
    const v = buildBookingTimeVars("2026-11-16", "10:00", "America/Santiago");
    expect(renderTemplate(WA, { ...v, duration: "120" })).toBe("🕐 10:00 (hora Chile)\n⏱ 120 minutos");
    expect(renderTemplate(WA_1H, v)).toBe("tu sesión comienza a las 10:00 (Chile).");
    expect(renderTemplate(EMAIL_LABEL, v)).toContain("Fecha y hora (Chile)");
  });

  it("paciente en México: no queda '(Chile)' duplicado ni la etiqueta falsa", () => {
    const v = buildBookingTimeVars("2026-11-16", "10:00", "America/Mexico_City");
    expect(renderTemplate(WA, { ...v, duration: "120" })).toBe("🕐 07:00 (10:00 hora de Chile)\n⏱ 120 minutos");
    expect(renderTemplate(WA_1H, v)).toBe("tu sesión comienza a las 07:00 (10:00 hora de Chile).");
    const html = renderTemplate(EMAIL_LABEL, v);
    expect(html).toContain("<p>Fecha y hora</p>");
    expect(html).not.toContain("(Chile)");
    expect(renderTemplate(SUBJECT_1H, { ...v, type_label: "Sesión TRVP" })).toBe(
      "Tu Sesión TRVP es en 1 hora — 07:00 (10:00 hora de Chile)",
    );
  });

  it("el aviso al terapeuta (time = hora de Chile) no se altera", () => {
    const v = { ...buildBookingTimeVars("2026-11-16", "10:00", "America/Mexico_City"), time: "10:00" };
    expect(renderTemplate("{{time}} (Chile)", v)).toBe("10:00 (Chile)");
  });
});
