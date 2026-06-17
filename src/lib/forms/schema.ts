// Validación server-only (zod) de la plataforma de formularios.
// El builder genera JSON arbitrario alcanzable por atacantes → validar al guardar.
// Los envíos públicos se validan contra la definición vigente del formulario.
import { z } from "zod";
import type { FormSchema, Question, Answers, AnswerValue } from "./types";

// ── Definición del formulario (lo que escribe el builder) ───────────────────

const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(300),
  value: z.string().min(1).max(300),
});

const baseShape = {
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  required: z.boolean(),
  key: z.string().max(120).optional(),
};

const questionSchema = z.discriminatedUnion("type", [
  z.object({ ...baseShape, type: z.enum(["short_text", "long_text"]), placeholder: z.string().max(300).optional(), maxLength: z.number().int().positive().optional() }),
  z.object({ ...baseShape, type: z.enum(["email", "phone"]) }),
  z.object({ ...baseShape, type: z.literal("number"), min: z.number().optional(), max: z.number().optional() }),
  z.object({ ...baseShape, type: z.enum(["single_choice", "dropdown"]), choices: z.array(choiceSchema).min(1).max(50) }),
  z.object({ ...baseShape, type: z.literal("multiple_choice"), choices: z.array(choiceSchema).min(1).max(50), minSelected: z.number().int().nonnegative().optional(), maxSelected: z.number().int().positive().optional() }),
  z.object({ ...baseShape, type: z.literal("date"), minDate: z.string().optional(), maxDate: z.string().optional() }),
  z.object({ ...baseShape, type: z.literal("yes_no") }),
  z.object({ ...baseShape, type: z.literal("rating"), scale: z.number().int().min(2).max(10), labelLow: z.string().max(120).optional(), labelHigh: z.string().max(120).optional() }),
  z.object({ ...baseShape, type: z.literal("consent"), consentText: z.string().min(1).max(2000) }),
  z.object({ ...baseShape, type: z.literal("statement"), required: z.literal(false) }),
]);

const conditionSchema = z.object({
  questionId: z.string().min(1),
  operator: z.enum(["eq", "neq", "contains", "not_contains", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const logicRuleSchema = z.object({
  id: z.string().min(1),
  sourceQuestionId: z.string().min(1),
  match: z.enum(["all", "any"]),
  conditions: z.array(conditionSchema).max(20),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("jump"), targetQuestionId: z.string().min(1) }),
    z.object({ type: z.literal("skip") }),
    z.object({ type: z.literal("end") }),
  ]),
});

export const formSchemaSchema = z.object({
  questions: z.array(questionSchema).max(200),
  logic: z.array(logicRuleSchema).max(200),
});

export const formSettingsSchema = z.object({
  submitLabel: z.string().max(120).optional(),
  thankYouTitle: z.string().max(200).optional(),
  thankYouMessage: z.string().max(2000).optional(),
  redirectUrl: z.string().url().max(500).optional(),
});

export const patientMappingSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notesFrom: z.array(z.string()).optional(),
}).nullable();

/**
 * Valida la definición completa de un formulario (al guardar desde el builder).
 * Verifica además que las reglas de lógica referencien ids de preguntas existentes.
 * Lanza ZodError o Error si es inválido; devuelve el schema tipado si es válido.
 */
export function parseFormSchema(input: unknown): FormSchema {
  const parsed = formSchemaSchema.parse(input) as FormSchema;
  const ids = new Set(parsed.questions.map((q) => q.id));
  if (ids.size !== parsed.questions.length) {
    throw new Error("Hay ids de pregunta duplicados.");
  }
  for (const rule of parsed.logic) {
    if (!ids.has(rule.sourceQuestionId)) throw new Error("Regla con sourceQuestionId inexistente.");
    for (const c of rule.conditions) {
      if (!ids.has(c.questionId)) throw new Error("Condición con questionId inexistente.");
    }
    if (rule.action.type === "jump" && !ids.has(rule.action.targetQuestionId)) {
      throw new Error("Acción jump con targetQuestionId inexistente.");
    }
  }
  return parsed;
}

// ── Validación de respuestas (envío público) ────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AnswerValidationResult {
  ok: boolean;
  errors: Record<string, string>; // questionId → mensaje
  cleaned: Answers; // respuestas normalizadas a guardar
}

function isEmpty(v: AnswerValue): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * Valida `answers` contra las preguntas del camino legítimo (`applicable`).
 * Las respuestas a preguntas fuera de ese camino se ignoran (anti-spoof).
 * Devuelve respuestas limpias listas para persistir.
 */
export function validateAnswers(applicable: Question[], raw: Answers): AnswerValidationResult {
  const errors: Record<string, string> = {};
  const cleaned: Answers = {};

  for (const q of applicable) {
    if (q.type === "statement") continue;
    const value = raw[q.id] ?? null;

    if (isEmpty(value)) {
      if (q.required) errors[q.id] = "Campo requerido.";
      continue;
    }

    switch (q.type) {
      case "short_text":
      case "long_text": {
        if (typeof value !== "string") { errors[q.id] = "Valor inválido."; break; }
        if (q.maxLength && value.length > q.maxLength) { errors[q.id] = `Máximo ${q.maxLength} caracteres.`; break; }
        cleaned[q.id] = value;
        break;
      }
      case "email": {
        if (typeof value !== "string" || !EMAIL_REGEX.test(value)) { errors[q.id] = "Correo inválido."; break; }
        cleaned[q.id] = value.trim().toLowerCase();
        break;
      }
      case "phone": {
        if (typeof value !== "string") { errors[q.id] = "Valor inválido."; break; }
        cleaned[q.id] = value.trim();
        break;
      }
      case "number": {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isNaN(n)) { errors[q.id] = "Número inválido."; break; }
        if (q.min !== undefined && n < q.min) { errors[q.id] = `Mínimo ${q.min}.`; break; }
        if (q.max !== undefined && n > q.max) { errors[q.id] = `Máximo ${q.max}.`; break; }
        cleaned[q.id] = n;
        break;
      }
      case "single_choice":
      case "dropdown": {
        const allowed = new Set(q.choices.map((c) => c.value));
        if (typeof value !== "string" || !allowed.has(value)) { errors[q.id] = "Opción inválida."; break; }
        cleaned[q.id] = value;
        break;
      }
      case "multiple_choice": {
        if (!Array.isArray(value)) { errors[q.id] = "Valor inválido."; break; }
        const allowed = new Set(q.choices.map((c) => c.value));
        if (!value.every((v) => typeof v === "string" && allowed.has(v))) { errors[q.id] = "Opción inválida."; break; }
        if (q.minSelected && value.length < q.minSelected) { errors[q.id] = `Selecciona al menos ${q.minSelected}.`; break; }
        if (q.maxSelected && value.length > q.maxSelected) { errors[q.id] = `Selecciona máximo ${q.maxSelected}.`; break; }
        cleaned[q.id] = value;
        break;
      }
      case "date": {
        if (typeof value !== "string" || Number.isNaN(Date.parse(value))) { errors[q.id] = "Fecha inválida."; break; }
        cleaned[q.id] = value;
        break;
      }
      case "yes_no": {
        if (typeof value !== "boolean") { errors[q.id] = "Valor inválido."; break; }
        cleaned[q.id] = value;
        break;
      }
      case "rating": {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isNaN(n) || n < 1 || n > q.scale) { errors[q.id] = "Calificación inválida."; break; }
        cleaned[q.id] = n;
        break;
      }
      case "consent": {
        if (value !== true) { if (q.required) errors[q.id] = "Debes aceptar para continuar."; break; }
        cleaned[q.id] = true;
        break;
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors, cleaned };
}
