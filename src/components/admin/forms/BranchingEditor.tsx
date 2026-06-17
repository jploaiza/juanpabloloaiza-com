"use client";

import { Plus, Trash2, GitBranch } from "lucide-react";
import type { Question, Operator, Condition, LogicRule, QuestionType } from "@/lib/forms/types";

const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "es igual a",
  neq: "no es igual a",
  contains: "contiene",
  not_contains: "no contiene",
  gt: "mayor que",
  gte: "mayor o igual que",
  lt: "menor que",
  lte: "menor o igual que",
  is_empty: "está vacío",
  is_not_empty: "no está vacío",
};

function allowedOps(type: QuestionType): Operator[] {
  switch (type) {
    case "single_choice":
    case "dropdown":
    case "yes_no":
      return ["eq", "neq", "is_empty", "is_not_empty"];
    case "multiple_choice":
      return ["contains", "not_contains", "is_empty", "is_not_empty"];
    case "number":
    case "rating":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"];
    case "consent":
      return ["eq", "is_empty", "is_not_empty"];
    default:
      return ["eq", "neq", "contains", "not_contains", "is_empty", "is_not_empty"];
  }
}

const sel = "bg-[#0a1628] border border-white/10 text-white px-2 py-1.5 font-crimson text-xs focus:outline-none focus:border-[#C5A059] transition";

export default function BranchingEditor({
  question,
  questions,
  logic,
  setLogic,
  markDirty,
}: {
  question: Question;
  questions: Question[];
  logic: LogicRule[];
  setLogic: (updater: (l: LogicRule[]) => LogicRule[]) => void;
  markDirty: () => void;
}) {
  const srcIdx = questions.findIndex((q) => q.id === question.id);
  const rules = logic.filter((r) => r.sourceQuestionId === question.id);
  // Preguntas que se pueden usar en condiciones: la actual y las anteriores (excepto statement).
  const condQuestions = questions.filter((q, i) => i <= srcIdx && q.type !== "statement");
  // Destinos de salto: preguntas posteriores.
  const laterQuestions = questions.filter((_, i) => i > srcIdx);

  function update(ruleId: string, patch: Partial<LogicRule>) {
    setLogic((l) => l.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
    markDirty();
  }
  function addRule() {
    const rule: LogicRule = {
      id: crypto.randomUUID(),
      sourceQuestionId: question.id,
      match: "all",
      conditions: [{ questionId: question.id, operator: allowedOps(question.type)[0], value: "" }],
      action: laterQuestions.length ? { type: "jump", targetQuestionId: laterQuestions[0].id } : { type: "end" },
    };
    setLogic((l) => [...l, rule]);
    markDirty();
  }
  function removeRule(ruleId: string) {
    setLogic((l) => l.filter((r) => r.id !== ruleId));
    markDirty();
  }
  function setCondition(ruleId: string, idx: number, patch: Partial<Condition>) {
    setLogic((l) =>
      l.map((r) => (r.id === ruleId ? { ...r, conditions: r.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)) } : r)),
    );
    markDirty();
  }
  function addCondition(ruleId: string) {
    setLogic((l) =>
      l.map((r) =>
        r.id === ruleId ? { ...r, conditions: [...r.conditions, { questionId: question.id, operator: allowedOps(question.type)[0], value: "" }] } : r,
      ),
    );
    markDirty();
  }
  function removeCondition(ruleId: string, idx: number) {
    setLogic((l) => l.map((r) => (r.id === ruleId ? { ...r, conditions: r.conditions.filter((_, i) => i !== idx) } : r)));
    markDirty();
  }

  function ValueInput({ cond, onChange }: { cond: Condition; onChange: (v: string | number | boolean) => void }) {
    if (cond.operator === "is_empty" || cond.operator === "is_not_empty") return null;
    const refQ = questions.find((q) => q.id === cond.questionId);
    if (refQ && (refQ.type === "single_choice" || refQ.type === "dropdown" || refQ.type === "multiple_choice")) {
      return (
        <select className={sel} value={String(cond.value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {refQ.choices.map((c) => (
            <option key={c.id} value={c.value}>{c.label}</option>
          ))}
        </select>
      );
    }
    if (refQ && refQ.type === "yes_no") {
      return (
        <select className={sel} value={cond.value === true ? "true" : cond.value === false ? "false" : ""} onChange={(e) => onChange(e.target.value === "true")}>
          <option value="">—</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      );
    }
    if (refQ && (refQ.type === "number" || refQ.type === "rating")) {
      return <input type="number" className={`${sel} w-24`} value={cond.value === undefined ? "" : String(cond.value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    }
    return <input className={`${sel} w-36`} value={String(cond.value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="valor" />;
  }

  return (
    <div className="mt-5 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-3.5 h-3.5 text-[#C5A059]" />
        <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]">Lógica de salto</p>
      </div>

      {rules.length === 0 && <p className="font-crimson text-xs text-gray-500 mb-3">Sin reglas. Por defecto continúa a la siguiente pregunta.</p>}

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-[#0a1628] border border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-crimson text-xs text-gray-400">Si</span>
                {rule.conditions.length > 1 && (
                  <select className={sel} value={rule.match} onChange={(e) => update(rule.id, { match: e.target.value as "all" | "any" })}>
                    <option value="all">se cumplen todas</option>
                    <option value="any">se cumple alguna</option>
                  </select>
                )}
              </div>
              <button onClick={() => removeRule(rule.id)} className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>

            <div className="space-y-2">
              {rule.conditions.map((cond, i) => {
                const refQ = questions.find((q) => q.id === cond.questionId) ?? question;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select className={sel} value={cond.questionId} onChange={(e) => setCondition(rule.id, i, { questionId: e.target.value, value: "" })}>
                      {condQuestions.map((q, qi) => (
                        <option key={q.id} value={q.id}>{qi + 1}. {q.title || "Sin título"}</option>
                      ))}
                    </select>
                    <select className={sel} value={cond.operator} onChange={(e) => setCondition(rule.id, i, { operator: e.target.value as Operator })}>
                      {allowedOps(refQ.type).map((op) => (
                        <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                      ))}
                    </select>
                    <ValueInput cond={cond} onChange={(v) => setCondition(rule.id, i, { value: v })} />
                    {rule.conditions.length > 1 && (
                      <button onClick={() => removeCondition(rule.id, i)} className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={() => addCondition(rule.id)} className="mt-2 font-crimson text-[11px] text-gray-400 hover:text-[#C5A059] transition flex items-center gap-1">
              <Plus className="w-3 h-3" /> condición
            </button>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
              <span className="font-crimson text-xs text-gray-400">entonces</span>
              <select
                className={sel}
                value={rule.action.type}
                onChange={(e) => {
                  const t = e.target.value as "jump" | "skip" | "end";
                  update(rule.id, { action: t === "jump" ? { type: "jump", targetQuestionId: laterQuestions[0]?.id ?? "" } : { type: t } });
                }}
              >
                {laterQuestions.length > 0 && <option value="jump">saltar a…</option>}
                <option value="skip">saltar la siguiente</option>
                <option value="end">terminar y enviar</option>
              </select>
              {rule.action.type === "jump" && (
                <select className={sel} value={rule.action.targetQuestionId} onChange={(e) => update(rule.id, { action: { type: "jump", targetQuestionId: e.target.value } })}>
                  {laterQuestions.map((q) => {
                    const qi = questions.findIndex((x) => x.id === q.id);
                    return <option key={q.id} value={q.id}>{qi + 1}. {q.title || "Sin título"}</option>;
                  })}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addRule} className="mt-3 font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] hover:text-[#d4b06a] transition flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Agregar regla
      </button>
    </div>
  );
}
