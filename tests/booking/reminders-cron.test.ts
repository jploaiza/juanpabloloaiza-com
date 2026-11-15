import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Simulación de Supabase, Resend y TextMeBot ───────────────────────────────
type Row = Record<string, unknown>;
const db = { bookings: [] as Row[], templates: [] as Row[], comms: [] as Row[], updates: [] as Row[] };

function builder(table: string) {
  const filters: Array<(r: Row) => boolean> = [];
  let mode: "select" | "update" | "insert" = "select";
  let payload: Row = {};
  const api: Record<string, unknown> = {
    select: () => api,
    eq: (c: string, v: unknown) => { filters.push((r) => r[c] === v); return api; },
    is: (c: string, v: unknown) => { filters.push((r) => (r[c] ?? null) === v); return api; },
    gte: (c: string, v: string) => { filters.push((r) => String(r[c]) >= v); return api; },
    lte: (c: string, v: string) => { filters.push((r) => String(r[c]) <= v); return api; },
    update: (p: Row) => { mode = "update"; payload = p; return api; },
    insert: (p: Row) => { mode = "insert"; payload = p; return api; },
    then: (resolve: (v: unknown) => void) => {
      if (mode === "insert") { db.comms.push(payload); return resolve({ data: null, error: null }); }
      const rows = (table === "bookings" ? db.bookings : db.templates).filter((r) => filters.every((f) => f(r)));
      if (mode === "update") { rows.forEach((r) => Object.assign(r, payload)); db.updates.push(payload); return resolve({ data: null, error: null }); }
      return resolve({ data: rows, error: null });
    },
  };
  return api;
}

vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ from: (t: string) => builder(t) }) }));
vi.mock("@/lib/booking-config", () => ({
  getCalendarConfig: async () => ({ site_url: "https://x.test", logo_url: "", from_email: "JP <a@x.test>" }),
  getEventTypes: async () => [{ slug: "session", label: "Sesión TRVP", duration_min: 120 }],
}));

const emailSend = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: emailSend }; } }));
const waSend = vi.fn();
vi.mock("@/lib/whatsapp", () => ({ sendWhatsApp: (a: unknown) => waSend(a) }));

import { GET, POST } from "@/app/api/cron/booking-reminders/route";

const SECRET = "s".repeat(40);
const req = (method: "GET" | "POST", headers: Record<string, string> = { "x-cron-secret": SECRET }) =>
  new NextRequest("https://x.test/api/cron/booking-reminders", { method, headers });

// "Ahora" fijo: lunes 16-nov-2026 09:00 UTC. Una cita a las 10:00 de Chile (UTC-3) ocurre a las 13:00 UTC.
const NOW = new Date("2026-11-16T09:00:00Z");

function booking(over: Row = {}): Row {
  return {
    id: "b1", type: "session", status: "confirmed", date: "2026-11-16", time_slot: "10:00",
    patient_name: "María García", patient_email: "maria@x.test", patient_phone: "+5215512345678",
    zoom_join_url: "https://zoom.us/j/1", booking_code: "ABC12345", user_tz: "America/Mexico_City",
    reminder_24h_sent_at: null, reminder_1h_sent_at: null, followup_24h_sent_at: null, followup_72h_sent_at: null,
    ...over,
  };
}
const tpl = (trigger: string, channel: string, body: string, subject: string | null = null): Row =>
  ({ event_type_slug: "session", trigger, channel, subject, body, is_active: true });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  process.env.CRON_SECRET = SECRET;
  process.env.RESEND_API_KEY = "re_test";
  db.bookings = []; db.templates = []; db.comms = []; db.updates = [];
  emailSend.mockReset().mockResolvedValue({ error: null });
  waSend.mockReset().mockResolvedValue({ ok: true });
});
afterEach(() => vi.useRealTimers());

describe("cron booking-reminders", () => {
  it("rechaza sin secreto y acepta x-cron-secret o Bearer, con GET y POST", async () => {
    expect((await GET(req("GET", {}))).status).toBe(401);
    expect((await POST(req("POST", { "x-cron-secret": "mal" }))).status).toBe(401);
    expect((await GET(req("GET"))).status).toBe(200);
    expect((await POST(req("POST", { authorization: `Bearer ${SECRET}` }))).status).toBe(200);
  });

  it("recordatorio de 1 h: envía correo y WhatsApp con la hora del paciente y marca como enviado", async () => {
    // cita a las 10:00 Chile = 13:00 UTC; ahora 12:00 UTC -> faltan 60 min
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    db.bookings = [booking()];
    db.templates = [
      tpl("reminder_1h", "whatsapp", "comienza a las {{time}} (Chile). {{zoom_join_url}}"),
      tpl("reminder_1h", "email", "<p>{{time}} (Chile)</p>", "Tu sesión es en 1 hora — {{time}} (Chile)"),
    ];
    const json = await (await GET(req("GET"))).json();

    expect(json.sent_1h).toBe(1);
    expect(waSend).toHaveBeenCalledTimes(1);
    expect(waSend.mock.calls[0][0].body).toBe("comienza a las 07:00 (10:00 hora de Chile). https://zoom.us/j/1");
    expect(emailSend.mock.calls[0][0].subject).toBe("Tu sesión es en 1 hora — 07:00 (10:00 hora de Chile)");
    expect(db.bookings[0].reminder_1h_sent_at).toBeTruthy();
    // comms_log ahora sí se escribe
    expect(db.comms.some((c) => c.type === "reminder_1h" && c.status === "sent")).toBe(true);
  });

  it("no envía fuera de la ventana", async () => {
    db.bookings = [booking()]; // ahora 09:00 UTC, la cita es en 4 h
    db.templates = [tpl("reminder_1h", "whatsapp", "hola")];
    const json = await (await GET(req("GET"))).json();
    expect(json.sent_1h).toBe(0);
    expect(waSend).not.toHaveBeenCalled();
  });

  it("si fallan todos los canales NO marca como enviado (se reintenta) y lo deja en comms_log", async () => {
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    db.bookings = [booking()];
    db.templates = [tpl("reminder_1h", "whatsapp", "hola")];
    waSend.mockResolvedValue({ ok: false, error: "TextMeBot HTTP 500" });

    const json = await (await GET(req("GET"))).json();
    expect(json.sent_1h).toBe(0);
    expect(json.failed).toBe(1);
    expect(db.bookings[0].reminder_1h_sent_at).toBeNull();
    expect(db.comms.find((c) => c.status === "error")?.body_preview).toContain("TextMeBot HTTP 500");

    // siguiente ejecución, ya funciona: se envía y se marca
    waSend.mockResolvedValue({ ok: true });
    expect((await (await GET(req("GET"))).json()).sent_1h).toBe(1);
    expect(db.bookings[0].reminder_1h_sent_at).toBeTruthy();
  });

  it("si un canal sale y el otro falla, se considera enviado (sin duplicar el que funcionó)", async () => {
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    db.bookings = [booking()];
    db.templates = [tpl("reminder_1h", "whatsapp", "hola"), tpl("reminder_1h", "email", "<p>x</p>", "s")];
    emailSend.mockResolvedValue({ error: { message: "dominio no verificado" } });
    expect((await (await GET(req("GET"))).json()).sent_1h).toBe(1);
    expect(db.bookings[0].reminder_1h_sent_at).toBeTruthy();
  });

  it("paciente sin teléfono: solo correo, sin error", async () => {
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    db.bookings = [booking({ patient_phone: "" })];
    db.templates = [tpl("reminder_1h", "email", "<p>x</p>", "s")];
    expect((await (await GET(req("GET"))).json()).sent_1h).toBe(1);
    expect(waSend).not.toHaveBeenCalled();
  });

  it("recordatorio de 24 h con cita de mañana en la mañana de Chile", async () => {
    // ahora 09:00 UTC (06:00 Chile). Cita mañana 17-nov 06:00 Chile = 09:00 UTC -> en 24 h.
    db.bookings = [booking({ id: "b2", date: "2026-11-17", time_slot: "06:00" })];
    db.templates = [tpl("reminder_24h", "whatsapp", "{{date_long}} {{time}}")];
    const json = await (await GET(req("GET"))).json();
    expect(json.sent_24h).toBe(1);
    expect(waSend.mock.calls[0][0].body).toContain("03:00 (06:00 hora de Chile)");
  });
});
