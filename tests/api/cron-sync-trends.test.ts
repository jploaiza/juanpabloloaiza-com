import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/trends/google-trends", () => ({
  fetchDailyTrends: vi.fn(async () => []),
  fetchRelatedQueries: vi.fn(async () => []),
  fetchInterestOverTime: vi.fn(async () => null),
}));

vi.mock("@/lib/trends/search-console", () => ({
  fetchTopQueries: vi.fn(async () => []),
}));

vi.mock("@/lib/trends/get-seeds", () => ({
  getActiveSeeds: vi.fn(async () => ["hipnosis", "terapia espiritual"]),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeAdminSupabase() {
  const upsertMock = vi.fn(() => Promise.resolve({ error: null }));
  const deleteMock = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
  const insertMock = vi.fn(() => Promise.resolve({ error: null }));
  const selectSnapshotsChain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve({ data: [] })),
  };
  const selectGscChain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve({ data: [] })),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "content_ideas") return { delete: deleteMock, upsert: upsertMock };
      if (table === "trends_run_logs") return { insert: insertMock };
      if (table === "trends_snapshots") return { upsert: upsertMock, ...selectSnapshotsChain };
      if (table === "gsc_queries") return { upsert: upsertMock, ...selectGscChain };
      if (table === "trends_interest_timeline") return { upsert: upsertMock };
      return { upsert: upsertMock, insert: insertMock };
    }),
    _mocks: { upsertMock, deleteMock, insertMock },
  };
}

function makeRequest(secret: string = "test-secret") {
  return new Request("http://localhost/api/cron/sync-trends", {
    headers: { "x-cron-secret": secret },
  }) as never;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("GET /api/cron/sync-trends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest("any"));
    expect(res.status).toBe(500);
  });

  it("returns 401 with wrong secret", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(makeAdminSupabase());

    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is empty", async () => {
    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(401);
  });

  it("returns 200 with correct secret and empty external data", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(makeAdminSupabase());

    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.duration_ms).toBe("number");
    expect(typeof json.trends_inserted).toBe("number");
    expect(typeof json.ideas_inserted).toBe("number");
    expect(typeof json.timeline_inserted).toBe("number");
  });

  it("calls fetchDailyTrends for each geo", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(makeAdminSupabase());

    const { fetchDailyTrends } = await import("@/lib/trends/google-trends");
    const { GET } = await import("@/app/api/cron/sync-trends/route");
    await GET(makeRequest("test-secret"));

    expect(fetchDailyTrends).toHaveBeenCalledTimes(4); // ES, US, MX, CL
  });

  it("calls fetchInterestOverTime for seeds × geos", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(makeAdminSupabase());

    const { fetchInterestOverTime } = await import("@/lib/trends/google-trends");
    const { GET } = await import("@/app/api/cron/sync-trends/route");
    await GET(makeRequest("test-secret"));

    // 2 seeds × 4 geos = 8 calls (mocked seeds: ["hipnosis", "terapia espiritual"])
    expect(fetchInterestOverTime).toHaveBeenCalledTimes(8);
  });

  it("includes timeline_inserted in response", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const sb = makeAdminSupabase();
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(sb);

    // Make fetchInterestOverTime return a value so timeline rows are inserted
    const { fetchInterestOverTime } = await import("@/lib/trends/google-trends");
    (fetchInterestOverTime as ReturnType<typeof vi.fn>).mockResolvedValue(42);

    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest("test-secret"));
    const json = await res.json();

    expect(json.timeline_inserted).toBeGreaterThan(0);
  });

  it("reports errors in response without crashing", async () => {
    const { createAdminClient } = await import("@/lib/supabase/server");

    // fetchDailyTrends returns data so upsert on trends_snapshots is triggered
    const { fetchDailyTrends } = await import("@/lib/trends/google-trends");
    (fetchDailyTrends as ReturnType<typeof vi.fn>).mockResolvedValue([
      { geo: "ES", keyword: "hipnosis", source: "daily_trend", seed_keyword: "", interest_score: 50, rising: true, raw: {} },
    ]);

    // Build a fully chainable mock where trends_snapshots upsert fails
    function makeChain(upsertError: boolean = false) {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      for (const m of ["select", "gte", "lte", "order", "eq"]) chain[m] = vi.fn(self);
      chain["limit"] = vi.fn(() => Promise.resolve({ data: [] }));
      chain["upsert"] = vi.fn(() => Promise.resolve({ error: upsertError ? { message: "DB error" } : null }));
      chain["delete"] = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
      chain["insert"] = vi.fn(() => Promise.resolve({ error: null }));
      return chain;
    }

    const sb = {
      from: vi.fn((table: string) =>
        table === "trends_snapshots" ? makeChain(true) : makeChain(false)
      ),
    };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(sb);

    const { GET } = await import("@/app/api/cron/sync-trends/route");
    const res = await GET(makeRequest("test-secret"));
    expect(res.status).toBe(200); // errors are in the body, not the status
    const json = await res.json();
    expect(json.errors).toBeDefined();
    expect(json.errors.length).toBeGreaterThan(0);
  });
});
