import { createAdminClient } from "@/lib/supabase/server";

export const BOOKING_TZ = "America/Santiago";

export type BookingType = string;

export interface CalendarConfig {
  timezone: string;
  working_hours: Record<string, [number, number] | null>;
  slot_step_min: number;
  lead_time_min: number;
  lookahead_days: number;
  max_bookings_per_day: number;
  from_email: string;
  site_url: string;
  logo_url: string;
  zoom: {
    waiting_room: boolean;
    host_video: boolean;
    participant_video: boolean;
    mute_upon_entry: boolean;
    join_before_host: boolean;
    auto_recording: string;
  };
  rate_limits: { availability: [number, number]; book: [number, number] };
  zoom_credentials?: { account_id: string; client_id: string; client_secret: string };
}

export interface EventType {
  id: string;
  slug: string;
  label: string;
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_CONFIG: CalendarConfig = {
  timezone: "America/Santiago",
  working_hours: { mon: [9, 19], tue: [9, 19], wed: [9, 19], thu: [9, 19], fri: [9, 19], sat: null, sun: null },
  slot_step_min: 30,
  lead_time_min: 30,
  lookahead_days: 60,
  max_bookings_per_day: 8,
  from_email: "Juan Pablo Loaiza <academy@juanpabloloaiza.com>",
  site_url: "https://www.juanpabloloaiza.com",
  logo_url: "https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png",
  zoom: { waiting_room: true, host_video: true, participant_video: true, mute_upon_entry: true, join_before_host: false, auto_recording: "none" },
  rate_limits: { availability: [30, 60], book: [5, 600] },
};

const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: "", slug: "session", label: "Sesión TRVP", duration_min: 90, buffer_before_min: 0, buffer_after_min: 0, color: "#C5A059", description: null, sort_order: 1, is_active: true },
  { id: "", slug: "entrevista", label: "Entrevista de Admisión", duration_min: 45, buffer_before_min: 0, buffer_after_min: 0, color: "#3b82f6", description: null, sort_order: 2, is_active: true },
];

// In-memory cache (TTL 60s)
let configCache: { data: CalendarConfig; exp: number } | null = null;
let eventTypesCache: { data: EventType[]; exp: number } | null = null;

export async function getCalendarConfig(): Promise<CalendarConfig> {
  const now = Date.now();
  if (configCache && now < configCache.exp) return configCache.data;
  try {
    const { data } = await createAdminClient()
      .from("crm_settings")
      .select("value")
      .eq("key", "calendar_config")
      .single();
    const config: CalendarConfig = data?.value ? { ...DEFAULT_CONFIG, ...(data.value as Partial<CalendarConfig>) } : DEFAULT_CONFIG;
    configCache = { data: config, exp: now + 60_000 };
    return config;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function getEventTypes(activeOnly = true): Promise<EventType[]> {
  const now = Date.now();
  if (eventTypesCache && now < eventTypesCache.exp) {
    return activeOnly ? eventTypesCache.data.filter((e) => e.is_active) : eventTypesCache.data;
  }
  try {
    const { data } = await createAdminClient()
      .from("event_types")
      .select("*")
      .order("sort_order", { ascending: true });
    const types = (data ?? []) as EventType[];
    eventTypesCache = { data: types, exp: now + 60_000 };
    return activeOnly ? types.filter((e) => e.is_active) : types;
  } catch {
    return DEFAULT_EVENT_TYPES;
  }
}

export function invalidateConfigCache() {
  configCache = null;
  eventTypesCache = null;
}
