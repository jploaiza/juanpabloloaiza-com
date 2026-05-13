import { describe, it, expect } from "vitest";
import {
  scoreTrendIdea,
  scoreGscIdea,
  buildTrendIdeas,
  buildGscIdeas,
  GEO_TO_COUNTRY,
} from "@/lib/trends/scoring";

describe("scoreTrendIdea", () => {
  it("adds 50 for rising", () => {
    expect(scoreTrendIdea(true, 0)).toBe(50);
  });

  it("adds interest_score on top of rising bonus", () => {
    expect(scoreTrendIdea(true, 30)).toBe(80);
  });

  it("returns 0 for non-rising with null score", () => {
    expect(scoreTrendIdea(false, null)).toBe(0);
  });

  it("returns interest_score only when not rising", () => {
    expect(scoreTrendIdea(false, 75)).toBe(75);
  });

  it("treats null score as 0", () => {
    expect(scoreTrendIdea(true, null)).toBe(50);
  });
});

describe("scoreGscIdea", () => {
  it("scores striking distance correctly (pos 10, 100 impressions)", () => {
    // 100/10 + (32-10)*5 = 10 + 110 = 120
    expect(scoreGscIdea(100, 10)).toBe(120);
  });

  it("scores higher for better position (pos 8 vs 20)", () => {
    expect(scoreGscIdea(50, 8)).toBeGreaterThan(scoreGscIdea(50, 20));
  });

  it("scores higher for more impressions", () => {
    expect(scoreGscIdea(500, 15)).toBeGreaterThan(scoreGscIdea(50, 15));
  });

  it("handles position 30 (lower boundary)", () => {
    // impressions/10 + (32-30)*5 = 5 + 10 = 15
    expect(scoreGscIdea(50, 30)).toBe(15);
  });
});

describe("GEO_TO_COUNTRY", () => {
  it("maps all expected geos", () => {
    expect(GEO_TO_COUNTRY.ES).toBe("esp");
    expect(GEO_TO_COUNTRY.US).toBe("usa");
    expect(GEO_TO_COUNTRY.MX).toBe("mex");
    expect(GEO_TO_COUNTRY.CL).toBe("chl");
  });
});

describe("buildTrendIdeas", () => {
  const base = { id: "1", keyword: "hipnosis", geo: "ES", rising: false, interest_score: 40 };

  it("returns empty array for empty input", () => {
    expect(buildTrendIdeas([])).toEqual([]);
  });

  it("sets status to new", () => {
    const result = buildTrendIdeas([base]);
    expect(result[0].status).toBe("new");
    expect(result[0].source).toBe("trends");
  });

  it("deduplicates same keyword+geo, keeps highest score", () => {
    const low = { ...base, id: "1", interest_score: 10, rising: false };
    const high = { ...base, id: "2", interest_score: 60, rising: false };
    const result = buildTrendIdeas([low, high]);
    expect(result).toHaveLength(1);
    expect(result[0].opportunity_score).toBe(60);
    expect((result[0].source_ref as { trends_snapshot_id: string }).trends_snapshot_id).toBe("2");
  });

  it("rising item beats non-rising with lower score", () => {
    const rising = { ...base, id: "r", rising: true, interest_score: 0 };   // score = 50
    const steady = { ...base, id: "s", rising: false, interest_score: 40 }; // score = 40
    const result = buildTrendIdeas([steady, rising]);
    expect(result[0].opportunity_score).toBe(50);
  });

  it("respects limit", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      keyword: `kw${i}`,
      geo: "ES",
      rising: false,
      interest_score: i,
    }));
    const result = buildTrendIdeas(many, 5);
    expect(result).toHaveLength(5);
  });

  it("sorts descending by score", () => {
    const items = [
      { id: "a", keyword: "a", geo: "ES", rising: false, interest_score: 10 },
      { id: "b", keyword: "b", geo: "ES", rising: false, interest_score: 90 },
      { id: "c", keyword: "c", geo: "ES", rising: false, interest_score: 50 },
    ];
    const result = buildTrendIdeas(items);
    expect(result[0].opportunity_score).toBe(90);
    expect(result[1].opportunity_score).toBe(50);
    expect(result[2].opportunity_score).toBe(10);
  });

  it("includes trends_snapshot_id in source_ref", () => {
    const result = buildTrendIdeas([base]);
    expect(result[0].source_ref).toMatchObject({ trends_snapshot_id: "1" });
  });
});

describe("buildGscIdeas", () => {
  const base = { id: "g1", query: "hipnosis clínica", country: "esp", impressions: 100, position: 15 };

  it("returns empty array for empty input", () => {
    expect(buildGscIdeas([])).toEqual([]);
  });

  it("maps country code to geo", () => {
    const result = buildGscIdeas([base]);
    expect(result[0].geo).toBe("ES");
  });

  it("skips rows with unknown country code", () => {
    const unknown = { ...base, country: "bra" };
    expect(buildGscIdeas([unknown])).toHaveLength(0);
  });

  it("includes gsc_query_id and position in source_ref", () => {
    const result = buildGscIdeas([base]);
    expect(result[0].source_ref).toMatchObject({ gsc_query_id: "g1", position: 15, impressions: 100 });
  });

  it("calculates correct opportunity_score", () => {
    // 100/10 + (32-15)*5 = 10 + 85 = 95
    const result = buildGscIdeas([base]);
    expect(result[0].opportunity_score).toBe(95);
  });

  it("sets source to gsc and status to new", () => {
    const result = buildGscIdeas([base]);
    expect(result[0].source).toBe("gsc");
    expect(result[0].status).toBe("new");
  });

  it("respects limit", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: `g${i}`, query: `q${i}`, country: "esp", impressions: 50, position: 15,
    }));
    const result = buildGscIdeas(many, 5);
    expect(result).toHaveLength(5);
  });

  it("maps all four country codes correctly", () => {
    const rows = [
      { id: "1", query: "a", country: "esp", impressions: 50, position: 15 },
      { id: "2", query: "b", country: "usa", impressions: 50, position: 15 },
      { id: "3", query: "c", country: "mex", impressions: 50, position: 15 },
      { id: "4", query: "d", country: "chl", impressions: 50, position: 15 },
    ];
    const result = buildGscIdeas(rows);
    expect(result.map((r) => r.geo).sort()).toEqual(["CL", "ES", "MX", "US"]);
  });
});
