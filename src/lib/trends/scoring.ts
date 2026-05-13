export const GEO_TO_COUNTRY: Record<string, string> = {
  ES: "esp",
  US: "usa",
  MX: "mex",
  CL: "chl",
};

export function scoreTrendIdea(rising: boolean, interestScore: number | null): number {
  return (rising ? 50 : 0) + (interestScore ?? 0);
}

export function scoreGscIdea(impressions: number, position: number): number {
  return impressions / 10 + (32 - position) * 5;
}

export interface TrendIdeaInput {
  id: string;
  keyword: string;
  geo: string;
  rising: boolean;
  interest_score: number | null;
}

export interface GscIdeaInput {
  id: string;
  query: string;
  country: string;
  impressions: number;
  position: number;
}

export interface ContentIdeaRow {
  seed_keyword: string;
  geo: string;
  source: string;
  source_ref: object;
  opportunity_score: number;
  status: string;
}

export function buildTrendIdeas(trends: TrendIdeaInput[], limit = 20): ContentIdeaRow[] {
  const deduped: Record<string, { keyword: string; geo: string; score: number; ref_id: string }> = {};
  for (const t of trends) {
    const k = `${t.keyword}::${t.geo}::trends`;
    const score = scoreTrendIdea(t.rising, t.interest_score);
    if (!deduped[k] || score > deduped[k].score) {
      deduped[k] = { keyword: t.keyword, geo: t.geo, score, ref_id: t.id };
    }
  }
  return Object.entries(deduped)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([, v]) => ({
      seed_keyword: v.keyword,
      geo: v.geo,
      source: "trends",
      source_ref: { trends_snapshot_id: v.ref_id },
      opportunity_score: v.score,
      status: "new",
    }));
}

export function buildGscIdeas(rows: GscIdeaInput[], limit = 20): ContentIdeaRow[] {
  return rows
    .flatMap((r) => {
      const geoEntry = Object.entries(GEO_TO_COUNTRY).find(([, c]) => c === r.country);
      if (!geoEntry) return [];
      return [{
        seed_keyword: r.query,
        geo: geoEntry[0],
        source: "gsc",
        source_ref: { gsc_query_id: r.id, position: r.position, impressions: r.impressions },
        opportunity_score: scoreGscIdea(r.impressions, r.position),
        status: "new",
      }];
    })
    .slice(0, limit);
}
