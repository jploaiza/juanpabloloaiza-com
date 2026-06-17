// Motor de ramificación puro y testeable.
// Usado por el renderer (navegación) y por el server (recomputar el camino
// legítimo para rechazar respuestas a preguntas que debieron saltarse).
import type { FormSchema, Question, Answers, AnswerValue, Condition, LogicRule } from "./types";

function isEmpty(v: AnswerValue | undefined): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

function normBool(v: unknown): boolean {
  return v === true || v === "true" || v === "Sí" || v === "si" || v === 1 || v === "1";
}

function looseEq(a: AnswerValue | undefined, b: unknown): boolean {
  if (typeof a === "boolean" || typeof b === "boolean") return normBool(a) === normBool(b);
  if (Array.isArray(a)) return a.map(String).includes(String(b));
  return String(a ?? "") === String(b ?? "");
}

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v);
}

export function evalCondition(cond: Condition, answers: Answers): boolean {
  const a = answers[cond.questionId];
  switch (cond.operator) {
    case "is_empty":
      return isEmpty(a);
    case "is_not_empty":
      return !isEmpty(a);
    case "eq":
      return looseEq(a, cond.value);
    case "neq":
      return !looseEq(a, cond.value);
    case "contains":
      return Array.isArray(a) ? a.map(String).includes(String(cond.value)) : String(a ?? "").includes(String(cond.value));
    case "not_contains":
      return Array.isArray(a) ? !a.map(String).includes(String(cond.value)) : !String(a ?? "").includes(String(cond.value));
    case "gt":
      return num(a) > num(cond.value);
    case "gte":
      return num(a) >= num(cond.value);
    case "lt":
      return num(a) < num(cond.value);
    case "lte":
      return num(a) <= num(cond.value);
    default:
      return false;
  }
}

export function evalRule(rule: LogicRule, answers: Answers): boolean {
  if (rule.conditions.length === 0) return false;
  return rule.match === "all"
    ? rule.conditions.every((c) => evalCondition(c, answers))
    : rule.conditions.some((c) => evalCondition(c, answers));
}

/**
 * Índice de la siguiente pregunta a mostrar tras responder `currentIndex`,
 * o "submit" si corresponde ir al envío. La primera regla que matchea gana.
 * Los saltos son solo hacia adelante; un target inválido/atrás cae a lineal.
 */
export function nextQuestionIndex(schema: FormSchema, currentIndex: number, answers: Answers): number | "submit" {
  const q = schema.questions[currentIndex];
  if (!q) return "submit";

  for (const rule of schema.logic) {
    if (rule.sourceQuestionId !== q.id) continue;
    if (!evalRule(rule, answers)) continue;
    const action = rule.action;
    if (action.type === "end") return "submit";
    if (action.type === "skip") {
      const ni = currentIndex + 2;
      return ni >= schema.questions.length ? "submit" : ni;
    }
    if (action.type === "jump") {
      const ti = schema.questions.findIndex((x) => x.id === action.targetQuestionId);
      if (ti > currentIndex) return ti; // solo hacia adelante
      // target inválido o hacia atrás → ignorar regla, seguir evaluando/lineal
    }
  }

  const ni = currentIndex + 1;
  return ni >= schema.questions.length ? "submit" : ni;
}

/**
 * Lista ordenada de las preguntas en el camino realmente recorrido según
 * `answers`. Con guard anti-loop. Lo usa el server para validar solo las
 * respuestas legítimas.
 */
export function computePath(schema: FormSchema, answers: Answers): Question[] {
  const path: Question[] = [];
  const visited = new Set<number>();
  let idx: number | "submit" = schema.questions.length ? 0 : "submit";
  while (idx !== "submit") {
    if (visited.has(idx)) break;
    visited.add(idx);
    path.push(schema.questions[idx]);
    idx = nextQuestionIndex(schema, idx, answers);
  }
  return path;
}
