"use client";

import { useState, useEffect } from "react";
import { X, Download, Search, Check, AlertCircle } from "lucide-react";
import { type PackSize, PACK_WEEKS, REMINDER_DAYS, calcEndDate } from "@/lib/patients";

interface LmsUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface SelectedUser extends LmsUser {
  pack_size: PackSize;
  start_date: string;
  reminder_day: number;
}

const PACK_OPTIONS: PackSize[] = [3, 5, 8];
const DEFAULT_PACK: PackSize = 5;
const TODAY = new Date().toISOString().split("T")[0];

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export default function ImportModal({ onClose, onImported }: Props) {
  const [users, setUsers] = useState<LmsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, SelectedUser>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/patients/lms-users")
      .then((r) => r.json())
      .then(({ users: u }) => setUsers(u ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(user: LmsUser) {
    setSelected((prev) => {
      if (prev[user.id]) {
        const next = { ...prev };
        delete next[user.id];
        return next;
      }
      return {
        ...prev,
        [user.id]: {
          ...user,
          pack_size: DEFAULT_PACK,
          start_date: TODAY,
          reminder_day: 1,
        },
      };
    });
  }

  function updateSelected(id: string, field: keyof SelectedUser, value: unknown) {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function selectAll() {
    const next: Record<string, SelectedUser> = {};
    filtered.forEach((u) => {
      next[u.id] = selected[u.id] ?? {
        ...u,
        pack_size: DEFAULT_PACK,
        start_date: TODAY,
        reminder_day: 1,
      };
    });
    setSelected(next);
  }

  async function doImport() {
    const list = Object.values(selected);
    if (!list.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: list }),
      });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) onImported();
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ["Error de conexión"] });
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = Object.keys(selected).length;

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a1628] border border-[#C5A059]/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C5A059]/15 flex-shrink-0">
          <div>
            <h2 className="font-cinzel text-[#C5A059] uppercase tracking-widest text-sm">
              Importar desde LMS
            </h2>
            <p className="text-gray-500 text-xs font-crimson mt-0.5">
              Usuarios inscritos que aún no son pacientes
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Result view */}
        {result ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Check size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-cinzel text-white text-lg">{result.imported} paciente{result.imported !== 1 ? "s" : ""} importado{result.imported !== 1 ? "s" : ""}</p>
              {result.skipped > 0 && <p className="text-gray-500 text-sm font-crimson mt-1">{result.skipped} omitidos</p>}
              {result.errors.map((e, i) => (
                <p key={i} className="text-red-400 text-xs font-crimson mt-1">{e}</p>
              ))}
            </div>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Search + Select all */}
            <div className="px-6 py-3 border-b border-[#C5A059]/10 flex items-center gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-[#020617] border border-[#C5A059]/15 text-white pl-8 pr-3 py-1.5 text-sm font-crimson focus:border-[#C5A059]/40 outline-none"
                />
              </div>
              <button
                onClick={selectAll}
                className="text-xs font-cinzel text-gray-500 hover:text-[#C5A059] uppercase tracking-widest transition whitespace-nowrap"
              >
                Sel. todos
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-[#C5A059]/8">
              {loading && (
                <div className="py-12 text-center text-gray-600 font-crimson">Cargando...</div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500 font-crimson">
                    {users.length === 0
                      ? "Todos los usuarios del LMS ya son pacientes"
                      : "Sin resultados"}
                  </p>
                </div>
              )}
              {filtered.map((user) => {
                const sel = selected[user.id];
                return (
                  <div key={user.id} className={`px-6 py-3 transition ${sel ? "bg-[#C5A059]/5" : "hover:bg-white/[0.02]"}`}>
                    {/* User row */}
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggle(user)}
                        className={`flex-shrink-0 w-5 h-5 border flex items-center justify-center transition ${
                          sel ? "border-[#C5A059] bg-[#C5A059]/20" : "border-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {sel && <Check size={11} className="text-[#C5A059]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-cinzel leading-snug truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-gray-500 text-xs font-crimson truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Pack config — only when selected */}
                    {sel && (
                      <div className="ml-8 grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Pack</label>
                          <select
                            value={sel.pack_size}
                            onChange={(e) => updateSelected(user.id, "pack_size", Number(e.target.value) as PackSize)}
                            className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-2 py-1 text-xs font-crimson outline-none"
                          >
                            {PACK_OPTIONS.map((p) => (
                              <option key={p} value={p}>Pack {p} ({PACK_WEEKS[p]}s)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Inicio</label>
                          <input
                            type="date"
                            value={sel.start_date}
                            onChange={(e) => updateSelected(user.id, "start_date", e.target.value)}
                            className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-2 py-1 text-xs font-crimson outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-cinzel text-gray-500 uppercase tracking-wide mb-1">Día</label>
                          <select
                            value={sel.reminder_day}
                            onChange={(e) => updateSelected(user.id, "reminder_day", Number(e.target.value))}
                            className="w-full bg-[#020617] border border-[#C5A059]/20 text-white px-2 py-1 text-xs font-crimson outline-none"
                          >
                            {REMINDER_DAYS.map((d, i) => (
                              <option key={i} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <p className="col-span-3 text-[10px] text-gray-600 font-crimson">
                          Vence: {new Date(calcEndDate(sel.start_date, sel.pack_size) + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#C5A059]/15 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-500 font-cinzel">
                {selectedCount > 0 ? `${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}` : "Ninguno seleccionado"}
              </span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-[#C5A059]/20 text-gray-400 text-xs font-cinzel uppercase tracking-widest hover:text-white transition">
                  Cancelar
                </button>
                <button
                  onClick={doImport}
                  disabled={!selectedCount || importing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={12} />
                  {importing ? "Importando..." : `Importar ${selectedCount > 0 ? selectedCount : ""}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
