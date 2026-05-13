import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockAdminFrom = vi.fn();
const { mockCreateClient, mockCreateAdminClient } = vi.hoisted(() => {
  const chain = () => {
    const q: Record<string, unknown> = {};
    const methods = ["select", "eq", "gte", "lte", "order", "limit", "upsert", "delete", "insert", "single"];
    for (const m of methods) {
      q[m] = vi.fn(() => q);
    }
    // Default resolve value
    (q as { then: unknown }).then = undefined;
    return q;
  };
  const mockCreateClient = vi.fn();
  const mockCreateAdminClient = vi.fn();
  return { mockCreateClient, mockCreateAdminClient, chain };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => true), // always pass
  getIp: vi.fn(() => "127.0.0.1"),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeSupabaseChain(resolveWith: unknown = { data: [], error: null }) {
  const methods = ["select", "eq", "gte", "lte", "order", "limit", "delete", "insert"];
  const chain: Record<string, unknown> = {};
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain["upsert"] = vi.fn(() => Promise.resolve({ error: null }));
  // Make the chain thenable (Promise-like) so await works
  chain["then"] = (resolve: (v: unknown) => void) => Promise.resolve(resolveWith).then(resolve);
  return chain;
}

function makeAdminClient(overrides: Record<string, unknown> = {}) {
  const chain = makeSupabaseChain();
  return {
    from: vi.fn(() => chain),
    ...overrides,
  };
}

function makeUserSupabase(role: string = "admin") {
  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { role } })) })) })),
    })),
  };
}

describe("POST /api/admin/trends/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFrom.mockReset();
  });

  it("returns 401 when user is not logged in", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null } })) },
    });

    const { POST } = await import("@/app/api/admin/trends/sync/route");
    const res = await POST(new Request("http://localhost/api/admin/trends/sync", { method: "POST" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    mockCreateClient.mockResolvedValue(makeUserSupabase("viewer"));
    mockCreateAdminClient.mockReturnValue(makeAdminClient());

    const { POST } = await import("@/app/api/admin/trends/sync/route");
    const res = await POST(new Request("http://localhost/api/admin/trends/sync", { method: "POST" }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 200 with ideas_inserted when admin calls sync with empty DB", async () => {
    mockCreateClient.mockResolvedValue(makeUserSupabase("admin"));

    // Build a fully-chainable query object that resolves to empty data
    function makeChain() {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      for (const m of ["select", "gte", "lte", "order", "eq"]) chain[m] = vi.fn(self);
      chain["limit"] = vi.fn(() => Promise.resolve({ data: [] }));
      chain["upsert"] = vi.fn(() => Promise.resolve({ error: null }));
      chain["delete"] = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
      return chain;
    }

    const adminSb = { from: vi.fn(() => makeChain()) };
    mockCreateAdminClient.mockReturnValue(adminSb);

    const { POST } = await import("@/app/api/admin/trends/sync/route");
    const res = await POST(new Request("http://localhost/api/admin/trends/sync", { method: "POST" }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(typeof json.ideas_inserted).toBe("number");
    expect(typeof json.duration_ms).toBe("number");
  });
});
