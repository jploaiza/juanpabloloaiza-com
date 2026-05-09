declare module "google-trends-api" {
  interface TrendsOptions {
    keyword?: string;
    keywords?: string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
  }

  function dailyTrends(options: TrendsOptions): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  function interestOverTime(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;
  function relatedTopics(options: TrendsOptions): Promise<string>;

  export = { dailyTrends, relatedQueries, interestOverTime, interestByRegion, relatedTopics };
}
