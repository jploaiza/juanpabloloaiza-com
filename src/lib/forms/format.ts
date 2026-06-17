// Helpers puros para formatear respuestas (reusados por email + visor admin).
import type { FormSchema, Question, Answers, AnswerValue } from "./types";

// Convierte el valor de una respuesta a texto legible, resolviendo labels de choices.
export function formatAnswer(q: Question, value: AnswerValue): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (q.type) {
    case "yes_no":
      return value === true ? "Sí" : "No";
    case "consent":
      return value === true ? "Aceptado" : "No aceptado";
    case "rating":
      return `${value} / ${q.scale}`;
    case "single_choice":
    case "dropdown": {
      const choice = q.choices.find((c) => c.value === value);
      return choice?.label ?? String(value);
    }
    case "multiple_choice": {
      if (!Array.isArray(value)) return String(value);
      const labels = value.map((v) => q.choices.find((c) => c.value === v)?.label ?? v);
      return labels.join(", ");
    }
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

// Filas { label, value } para todas las preguntas con input (excluye statement).
export function answersToRows(schema: FormSchema, answers: Answers): { label: string; value: string }[] {
  return schema.questions
    .filter((q) => q.type !== "statement")
    .map((q) => ({ label: q.title, value: formatAnswer(q, answers[q.id] ?? null) }));
}

// Resuelve nombre/email/teléfono denormalizados desde las respuestas.
// Usa patient_mapping si está; si no, detecta por tipo / palabras clave.
export function resolveContact(
  schema: FormSchema,
  answers: Answers,
  mapping?: { full_name?: string; email?: string; phone?: string } | null,
): { full_name: string | null; email: string | null; phone: string | null } {
  const get = (qid?: string): string | null => {
    if (!qid) return null;
    const v = answers[qid];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  let full_name = get(mapping?.full_name);
  let email = get(mapping?.email);
  let phone = get(mapping?.phone);

  if (!email) {
    const q = schema.questions.find((q) => q.type === "email");
    email = q ? get(q.id) : null;
  }
  if (!phone) {
    const q = schema.questions.find((q) => q.type === "phone");
    phone = q ? get(q.id) : null;
  }
  if (!full_name) {
    const q = schema.questions.find(
      (q) => q.key === "full_name" || (q.type === "short_text" && /nombre|name/i.test(q.title)),
    );
    full_name = q ? get(q.id) : null;
  }

  return { full_name, email, phone };
}
