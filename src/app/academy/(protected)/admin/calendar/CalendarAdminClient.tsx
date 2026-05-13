"use client";

import { useState } from "react";
import { Settings, Tag, CalendarOff, Calendar, Video, Mail, MessageSquare, BookOpen } from "lucide-react";
import GeneralSettings from "@/components/admin/calendar/GeneralSettings";
import EventTypesPanel from "@/components/admin/calendar/EventTypesPanel";
import BlackoutsPanel from "@/components/admin/calendar/BlackoutsPanel";
import GoogleCalendarPanel from "@/components/admin/calendar/GoogleCalendarPanel";
import ZoomPanel from "@/components/admin/calendar/ZoomPanel";
import AlertsPanel from "@/components/admin/calendar/AlertsPanel";
import BookingsPanel from "@/components/admin/calendar/BookingsPanel";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "event-types", label: "Tipos de evento", icon: Tag },
  { id: "blackouts", label: "Días bloqueados", icon: CalendarOff },
  { id: "google", label: "Google Calendar", icon: Calendar },
  { id: "zoom", label: "Zoom", icon: Video },
  { id: "alerts-email", label: "Alertas Email", icon: Mail },
  { id: "alerts-whatsapp", label: "Alertas WhatsApp", icon: MessageSquare },
  { id: "bookings", label: "Reservas", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CalendarAdminClient() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]">Admin</p>
        <h1 className="font-cinzel text-white text-2xl mt-1">Calendario</h1>
        <p className="font-crimson text-gray-400 text-sm mt-1">
          Configura horarios, tipos de evento, alertas y recordatorios.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-cinzel text-[9px] uppercase tracking-widest transition border-b-2 -mb-px ${
              activeTab === id
                ? "text-[#C5A059] border-[#C5A059]"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "event-types" && <EventTypesPanel />}
        {activeTab === "blackouts" && <BlackoutsPanel />}
        {activeTab === "google" && <GoogleCalendarPanel />}
        {activeTab === "zoom" && <ZoomPanel />}
        {activeTab === "alerts-email" && <AlertsPanel channel="email" />}
        {activeTab === "alerts-whatsapp" && <AlertsPanel channel="whatsapp" />}
        {activeTab === "bookings" && <BookingsPanel />}
      </div>
    </div>
  );
}
