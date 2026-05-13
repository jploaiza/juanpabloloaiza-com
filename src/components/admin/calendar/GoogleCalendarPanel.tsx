"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarStatusBanner from "@/components/patients/CalendarStatusBanner";

export default function GoogleCalendarPanel() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/status");
      const d = await res.json();
      setConnected(!!d.connected);
      setScheduledCount(d.scheduledCount ?? 0);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleDisconnect() {
    await fetch("/api/calendar/disconnect", { method: "POST" });
    setConnected(false);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-cinzel text-white text-sm uppercase tracking-widest mb-6">Google Calendar</h2>
      <CalendarStatusBanner
        connected={connected}
        loading={loading}
        scheduledCount={scheduledCount}
        onDisconnect={handleDisconnect}
        onRefresh={loadStatus}
      />
    </div>
  );
}
