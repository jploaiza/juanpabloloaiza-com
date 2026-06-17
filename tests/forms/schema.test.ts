import { describe, it, expect } from "vitest";
import { parseFormSchema, validateAnswers } from "@/lib/forms/schema";
import type { Question } from "@/lib/forms/types";

const baseQuestions = [
  { id: "a", type: "short_text", title: "Nombre", required: true },
  { id: "b", type: "single_choice", title: "Color", required: true, choices: [{ id: "c1", label: "Rojo", value: "rojo" }, { id: "c2", label: "Azul", value: "azul" }] },
  { id: "c", type: "email", title: "Correo", required: false },
];

describe("parseFormSchema", () => {
  it("acepta un schema válido", () => {
    const parsed = parseFormSchema({ questions: baseQuestions, logic: [] });
    expect(parsed.questions).toHaveLength(3);
  });
  it("rechaza ids duplicados", () => {
    expect(() => parseFormSchema({ questions: [baseQuestions[0], baseQuestions[0]], logic: [] })).toThrow();
  });
  it("rechaza jump a target inexistente", () => {
    const logic = [{ id: "r", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "is_not_empty" }], action: { type: "jump", targetQuestionId: "zzz" } }];
    expect(() => parseFormSchema({ questions: baseQuestions, logic })).toThrow();
  });
  it("rechaza salto hacia atrás", () => {
    const logic = [{ id: "r", sourceQuestionId: "c", match: "all", conditions: [{ questionId: "c", operator: "is_not_empty" }], action: { type: "jump", targetQuestionId: "a" } }];
    expect(() => parseFormSchema({ questions: baseQuestions, logic })).toThrow();
  });
  it("rechaza tipo de pregunta inválido", () => {
    expect(() => parseFormSchema({ questions: [{ id: "x", type: "telepatia", title: "?", required: false }], logic: [] })).toThrow();
  });
});

describe("validateAnswers", () => {
  const qs = baseQuestions as Question[];

  it("marca requeridos vacíos", () => {
    const res = validateAnswers(qs, {});
    expect(res.ok).toBe(false);
    expect(res.errors.a).toBeDefined();
    expect(res.errors.b).toBeDefined();
  });
  it("acepta respuestas válidas y limpia", () => {
    const res = validateAnswers(qs, { a: "Juan", b: "rojo", c: "JUAN@MAIL.COM" });
    expect(res.ok).toBe(true);
    expect(res.cleaned.a).toBe("Juan");
    expect(res.cleaned.c).toBe("juan@mail.com"); // normaliza email
  });
  it("rechaza opción fuera del set", () => {
    const res = validateAnswers(qs, { a: "Juan", b: "verde" });
    expect(res.ok).toBe(false);
    expect(res.errors.b).toBeDefined();
  });
  it("rechaza email mal formado", () => {
    const res = validateAnswers(qs, { a: "Juan", b: "rojo", c: "no-es-email" });
    expect(res.ok).toBe(false);
    expect(res.errors.c).toBeDefined();
  });
});
