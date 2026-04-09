"use client";

import { useState, useCallback } from "react";
import { Plus, Search, RefreshCw, Users, Activity, Clock, Download, Bell, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Patient, type PatientStatus, patientFullName } from "@/lib/patients";
import PatientCard from "./PatientCard";
import PatientForm from "./PatientForm";
import ImportModal from "./ImportModal";
import RemindersConsole from "./RemindersConsole";
import SettingsPanel from "./SettingsPanel";

type Tab = PatientStatus | "reminders" | "settings";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "active", label: "Activos", icon: <Activity size={13} /> },
  { key: "paused", label: "Pausados", icon: <Clock size={13} /> },
  { key: "finished", label: "Finalizados", icon: <Users size={13} /> },
  { key: "reminders", label: "Recordatorios", icon: <Bell size={13} /> },
  { key: "settings", label: "Configuración", icon: <Settings size={13} /> },
];

interface Props {
  initialPatients: Patient[];
  lastSessions: Record<string, string | null>;
}

export default function CrmDashboard({ initialPatients, lastSessions }: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [lastSessionsMap, setLastSessionsMap] = useState(lastSessions);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) return;
      const { patients: fresh, lastSessions: freshSessions } = await res.json();
      setPatients(fresh ?? []);
      setLastSessionsMap(freshSessions ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = patients
    .filter((p) => activeTab !== "reminders" && activeTab !== "settings" && p.status === activeTab)
    .filter((p) =>
      !search || patientFullName(p).toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    );

  const counts: Record<Tab, number> = {
    active: patients.filter((p) => p.status === "active").length,
    paused: patients.filter((p) => p.status === "paused").length,
    finished: patients.filter((p) => p.status === "finished").length,
    reminders: 0,
    settings: 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[#C5A059] uppercase tracking-widest text-xs font-cinzel">Admin CRM</span>
          <h1 className="text-2xl sm:text-3xl font-cinzel text-white mt-1">Gestión de Pacientes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 border border-[#C5A059]/20 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059]/40 transition disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#C5A059]/30 text-[#C5A059] text-xs font-cinzel uppercase tracking-widest hover:bg-[#C5A059]/10 transition"
          >
            <Download size={13} />
            Importar LMS
          </button>
          <button
            onClick={() => { setEditPatient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#020617] text-xs font-cinzel uppercase tracking-widest hover:bg-[#D4B06A] transition"
          >
            <Plus size={13} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#C5A059]/15 mb-6">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-cinzel uppercase tracking-widest transition border-b-2 -mb-px ${
              activeTab === key
                ? "border-[#C5A059] text-[#C5A059]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {icon}
            {label}
            {key !== "reminders" && key !== "settings" && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === key ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-gray-800 text-gray-500"
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search — hidden on reminders and settings tabs */}
      {activeTab !== "reminders" && activeTab !== "settings" && (
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full sm:max-w-xs bg-[#0a1628] border border-[#C5A059]/15 text-white pl-9 pr-3 py-2 text-sm font-crimson focus:border-[#C5A059]/40 outline-none"
          />
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "settings" ? (
            <SettingsPanel />
          ) : activeTab === "reminders" ? (
            <RemindersConsole />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 font-crimson text-lg">
                {search ? "Sin resultados" : `No hay pacientes ${activeTab === "active" ? "activos" : activeTab === "paused" ? "pausados" : "finalizados"}`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  lastSessionAt={lastSessionsMap[patient.id]}
                  onEdit={(p) => { setEditPatient(p); setShowForm(true); }}
                  onRefresh={refresh}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Form modal */}
      {showForm && (
        <PatientForm
          patient={editPatient}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          onSaved={refresh}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}
