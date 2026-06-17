import { describe, it, expect } from "vitest";
import { nextQuestionIndex, computePath, evalCondition } from "@/lib/forms/branching";
import type { FormSchema, Question } from "@/lib/forms/types";

function q(id: string, extra: Partial<Question> = {}): Question {
  return { id, type: "short_text", title: id, required: false, ...extra } as Question;
}

const linear: FormSchema = { questions: [q("a"), q("b"), q("c")], logic: [] };

describe("nextQuestionIndex — lineal", () => {
  it("avanza +1 sin reglas", () => {
    expect(nextQuestionIndex(linear, 0, {})).toBe(1);
    expect(nextQuestionIndex(linear, 1, {})).toBe(2);
  });
  it("la última pregunta va a submit", () => {
    expect(nextQuestionIndex(linear, 2, {})).toBe("submit");
  });
});

describe("nextQuestionIndex — reglas", () => {
  const schema: FormSchema = {
    questions: [
      { id: "a", type: "yes_no", title: "¿Continuar?", required: true },
      q("b"),
      q("c"),
    ],
    logic: [
      { id: "r1", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "eq", value: false }], action: { type: "end" } },
      { id: "r2", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "eq", value: true }], action: { type: "jump", targetQuestionId: "c" } },
    ],
  };

  it("end → submit", () => {
    expect(nextQuestionIndex(schema, 0, { a: false })).toBe("submit");
  });
  it("jump → índice del destino", () => {
    expect(nextQuestionIndex(schema, 0, { a: true })).toBe(2);
  });
  it("sin match → lineal", () => {
    const noMatch: FormSchema = { questions: schema.questions, logic: [schema.logic[1]] };
    expect(nextQuestionIndex(noMatch, 0, { a: false })).toBe(1);
  });
  it("skip salta la siguiente", () => {
    const s: FormSchema = { questions: [q("a"), q("b"), q("c")], logic: [{ id: "r", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "is_not_empty" }], action: { type: "skip" } }] };
    expect(nextQuestionIndex(s, 0, { a: "x" })).toBe(2);
  });
  it("ignora salto hacia atrás (defensivo)", () => {
    const s: FormSchema = { questions: [q("a"), q("b"), q("c")], logic: [{ id: "r", sourceQuestionId: "c", match: "all", conditions: [{ questionId: "c", operator: "is_not_empty" }], action: { type: "jump", targetQuestionId: "a" } }] };
    expect(nextQuestionIndex(s, 2, { c: "x" })).toBe("submit");
  });
});

describe("computePath", () => {
  it("camino lineal completo", () => {
    expect(computePath(linear, {}).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("salta b cuando a=true", () => {
    const schema: FormSchema = {
      questions: [{ id: "a", type: "yes_no", title: "a", required: true }, q("b"), q("c")],
      logic: [{ id: "r", sourceQuestionId: "a", match: "all", conditions: [{ questionId: "a", operator: "eq", value: true }], action: { type: "jump", targetQuestionId: "c" } }],
    };
    expect(computePath(schema, { a: true }).map((x) => x.id)).toEqual(["a", "c"]);
    expect(computePath(schema, { a: false }).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("evalCondition", () => {
  it("eq con choice", () => {
    expect(evalCondition({ questionId: "x", operator: "eq", value: "rojo" }, { x: "rojo" })).toBe(true);
    expect(evalCondition({ questionId: "x", operator: "eq", value: "rojo" }, { x: "azul" })).toBe(false);
  });
  it("contains en multiple_choice", () => {
    expect(evalCondition({ questionId: "x", operator: "contains", value: "b" }, { x: ["a", "b"] })).toBe(true);
    expect(evalCondition({ questionId: "x", operator: "contains", value: "z" }, { x: ["a", "b"] })).toBe(false);
  });
  it("comparaciones numéricas", () => {
    expect(evalCondition({ questionId: "x", operator: "gt", value: 5 }, { x: 7 })).toBe(true);
    expect(evalCondition({ questionId: "x", operator: "lte", value: 5 }, { x: 5 })).toBe(true);
  });
  it("is_empty / is_not_empty", () => {
    expect(evalCondition({ questionId: "x", operator: "is_empty" }, { x: "" })).toBe(true);
    expect(evalCondition({ questionId: "x", operator: "is_not_empty" }, { x: "hola" })).toBe(true);
  });
  it("yes_no booleano", () => {
    expect(evalCondition({ questionId: "x", operator: "eq", value: true }, { x: true })).toBe(true);
    expect(evalCondition({ questionId: "x", operator: "eq", value: false }, { x: true })).toBe(false);
  });
});
