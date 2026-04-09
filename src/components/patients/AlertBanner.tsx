"use client";

import { AlertTriangle, AlertCircle, Clock } from "lucide-react";
import type { PatientAlert } from "@/lib/patients";

const ICONS = {
  danger: <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />,
  warning: <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />,
  orange: <Clock className="w-3.5 h-3.5 flex-shrink-0" />,
};

const COLORS = {
  danger: "bg-red-950/60 border-red-500/40 text-red-400",
  warning: "bg-yellow-950/60 border-yellow-500/40 text-yellow-400",
  orange: "bg-orange-950/60 border-orange-500/40 text-orange-400",
};

export default function AlertBanner({ alerts }: { alerts: PatientAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {alerts.map((a, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-[10px] font-cinzel uppercase tracking-wide px-2 py-0.5 border rounded-sm ${COLORS[a.type]}`}
        >
          {ICONS[a.type]}
          {a.message}
        </span>
      ))}
    </div>
  );
}
