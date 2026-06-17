// Tipos compartidos (cliente + server) de la plataforma de formularios.
// La definición de un formulario se guarda como `FormSchema` en forms.schema (jsonb).
// La validación server-side vive en ./schema.ts (zod) — aquí solo tipos puros.

export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "date"
  | "yes_no"
  | "rating"
  | "consent"
  | "statement";

export interface Choice {
  id: string;
  label: string;
  value: string;
}

interface BaseQuestion {
  id: string; // crypto.randomUUID() — estable, nunca se reusa
  type: QuestionType;
  title: string; // la pregunta mostrada al usuario
  description?: string; // texto de ayuda
  required: boolean;
  key?: string; // clave estable opcional para mapeo a CRM / headers de export
}

export type Question =
  | (BaseQuestion & { type: "short_text" | "long_text"; placeholder?: string; maxLength?: number })
  | (BaseQuestion & { type: "email" | "phone" })
  | (BaseQuestion & { type: "number"; min?: number; max?: number })
  | (BaseQuestion & { type: "single_choice" | "dropdown"; choices: Choice[] })
  | (BaseQuestion & { type: "multiple_choice"; choices: Choice[]; minSelected?: number; maxSelected?: number })
  | (BaseQuestion & { type: "date"; minDate?: string; maxDate?: string })
  | (BaseQuestion & { type: "yes_no" })
  | (BaseQuestion & { type: "rating"; scale: number; labelLow?: string; labelHigh?: string })
  | (BaseQuestion & { type: "consent"; consentText: string })
  | (BaseQuestion & { type: "statement"; required: false });

// ── Ramificación / lógica condicional ──────────────────────────────────────

export type Operator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty";

export interface Condition {
  questionId: string; // qué respuesta se evalúa
  operator: Operator;
  value?: string | number | boolean; // contra qué se compara
}

export type LogicAction =
  | { type: "jump"; targetQuestionId: string } // saltar a una pregunta posterior
  | { type: "skip" } // saltar la pregunta siguiente
  | { type: "end" }; // ir directo al envío

export interface LogicRule {
  id: string;
  sourceQuestionId: string; // se evalúa al salir de esta pregunta
  match: "all" | "any"; // AND / OR entre condiciones
  conditions: Condition[];
  action: LogicAction;
}

// ── Schema completo del formulario ──────────────────────────────────────────

export interface FormSchema {
  questions: Question[]; // ordenadas
  logic: LogicRule[];
}

export interface FormSettings {
  submitLabel?: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
  redirectUrl?: string;
}

// Mapea respuestas → columnas de `patients` (solo forms de admisión).
export interface PatientMapping {
  full_name?: string; // questionId
  email?: string; // questionId
  phone?: string; // questionId
  notesFrom?: string[]; // questionIds concatenados en patients.notes
}

export type FormStatus = "draft" | "published" | "deleted";

// Fila de `forms` tal como la devuelve Supabase.
export interface FormRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  schema: FormSchema;
  settings: FormSettings;
  patient_mapping: PatientMapping | null;
  status: FormStatus;
  is_admission: boolean;
  notify_email: boolean;
  notify_whatsapp: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Valor de respuesta por tipo, guardado en form_submissions.answers.
export type AnswerValue = string | number | boolean | string[] | null;
export type Answers = Record<string, AnswerValue>;

// Lista de tipos con metadatos para el builder (label + si lleva opciones).
export const QUESTION_TYPE_META: Record<QuestionType, { label: string; hasChoices: boolean }> = {
  short_text: { label: "Texto corto", hasChoices: false },
  long_text: { label: "Texto largo", hasChoices: false },
  email: { label: "Correo electrónico", hasChoices: false },
  phone: { label: "Teléfono", hasChoices: false },
  number: { label: "Número", hasChoices: false },
  single_choice: { label: "Opción única", hasChoices: true },
  multiple_choice: { label: "Opción múltiple", hasChoices: true },
  dropdown: { label: "Desplegable", hasChoices: true },
  date: { label: "Fecha", hasChoices: false },
  yes_no: { label: "Sí / No", hasChoices: false },
  rating: { label: "Calificación", hasChoices: false },
  consent: { label: "Consentimiento", hasChoices: false },
  statement: { label: "Texto informativo", hasChoices: false },
};
