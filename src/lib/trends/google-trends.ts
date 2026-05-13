import googleTrends from "google-trends-api";

export type TrendGeo = "ES" | "US" | "MX" | "CL";

export interface TrendKeyword {
  keyword: string;
  geo: TrendGeo;
  source: "daily_trend" | "related_query" | "interest_over_time";
  seed_keyword: string | null;
  interest_score: number | null;
  rising: boolean;
  raw: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchDailyTrends(geo: TrendGeo): Promise<TrendKeyword[]> {
  await sleep(500);
  try {
    const raw = await googleTrends.dailyTrends({ geo, hl: "es" });
    const parsed = JSON.parse(raw);
    const days = parsed?.default?.trendingSearchesDays ?? [];
    const results: TrendKeyword[] = [];
    for (const day of days) {
      for (const item of day.trendingSearches ?? []) {
        const keyword = item?.title?.query;
        if (!keyword) continue;
        results.push({
          keyword,
          geo,
          source: "daily_trend",
          seed_keyword: null,
          interest_score: null,
          rising: true,
          raw: item,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchRelatedQueries(
  seed: string,
  geo: TrendGeo
): Promise<TrendKeyword[]> {
  await sleep(500);
  try {
    const raw = await googleTrends.relatedQueries({ keyword: seed, geo, hl: "es" });
    const parsed = JSON.parse(raw);
    const defaultData = parsed?.default?.rankedList ?? [];
    const results: TrendKeyword[] = [];
    // rankedList[0] = "Top" queries, rankedList[1] = "Rising" queries
    for (let listIdx = 0; listIdx < defaultData.length; listIdx++) {
      const isRisingList = listIdx === 1;
      for (const item of defaultData[listIdx].rankedKeyword ?? []) {
        const keyword = item?.query;
        if (!keyword) continue;
        const rising =
          isRisingList ||
          (typeof item.value === "string" && item.value.startsWith("Breakout"));
        results.push({
          keyword,
          geo,
          source: "related_query",
          seed_keyword: seed,
          interest_score: typeof item.value === "number" ? item.value : null,
          rising,
          raw: item,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchInterestOverTime(
  keyword: string,
  geo: TrendGeo
): Promise<number | null> {
  await sleep(500);
  try {
    const raw = await googleTrends.interestOverTime({
      keyword,
      geo,
      hl: "es",
      startTime: new Date(Date.now() - 7 * 86400000),
    });
    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData ?? [];
    if (!timeline.length) return null;
    const lastPoint = timeline[timeline.length - 1];
    return lastPoint?.value?.[0] ?? null;
  } catch {
    return null;
  }
}
