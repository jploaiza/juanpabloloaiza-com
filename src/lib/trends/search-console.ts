import { google } from "googleapis";

export interface GscRow {
  query: string;
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function getAuth() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }

  // Fallback: service account JWT (only works if account is added to GSC)
  const email = process.env.GOOGLE_SA_EMAIL ?? "";
  const key = (process.env.GOOGLE_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!email || !key) return null;

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function fetchTopQueries(opts: {
  startDate: string;
  endDate: string;
  country?: string;
}): Promise<GscRow[]> {
  const auth = getAuth();
  if (!auth) return [];

  const siteUrl = process.env.GSC_SITE_URL ?? "";
  if (!siteUrl) return [];

  try {
    const sc = google.searchconsole({ version: "v1", auth });
    const res = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: opts.startDate,
        endDate: opts.endDate,
        dimensions: ["query", "country"],
        rowLimit: 5000,
        ...(opts.country ? { dimensionFilterGroups: [{ filters: [{ dimension: "country", expression: opts.country, operator: "equals" }] }] } : {}),
      },
    });

    return (res.data.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? "",
      country: r.keys?.[1] ?? "all",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: number }).code;
    const detail = (err as { errors?: unknown[] }).errors;
    console.error(`[GSC] code=${code} msg=${msg} detail=${JSON.stringify(detail)}`);
    throw err;  // let callers surface the full error
  }
}

export function getStrikingDistanceQueries(rows: GscRow[]): GscRow[] {
  return rows.filter((r) => r.impressions >= 30 && r.position >= 8 && r.position <= 30);
}
