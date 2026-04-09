import { describe, it, expect, vi, beforeEach } from "vitest";

const { MockImageResponse } = vi.hoisted(() => {
  class MockImageResponse extends Response {
    static lastElement = "";
    static lastOptions: unknown = {};
    constructor(element: unknown, options?: unknown) {
      // Serialize the React element to HTML for inspection
      const { renderToStaticMarkup: render } = require("react-dom/server");
      const html = render(element as React.ReactElement);
      super(html, { headers: { "content-type": "image/png" } });
      MockImageResponse.lastElement = html;
      MockImageResponse.lastOptions = options ?? {};
    }
  }
  return { MockImageResponse };
});

vi.mock("next/og", () => ({ ImageResponse: MockImageResponse }));

import { GET } from "@/app/api/og/story/route";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("https://juanpabloloaiza.com/api/og/story");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/og/story", () => {
  beforeEach(() => {
    MockImageResponse.lastElement = "";
    MockImageResponse.lastOptions = {};
  });

  it("returns a response with image/png content-type", async () => {
    const req = makeRequest({ title: "Test Article", slug: "test-article" });
    const res = await GET(req as never);
    expect(res.headers.get("content-type")).toBe("image/png");
  });

  it("uses default title when no params provided", async () => {
    const req = makeRequest();
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("Juan Pablo Loaiza");
  });

  it("truncates title longer than 80 characters", async () => {
    const longTitle = "A".repeat(90);
    const req = makeRequest({ title: longTitle, slug: "test" });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("...");
    expect(element).not.toContain("A".repeat(81));
  });

  it("truncates excerpt longer than 150 characters", async () => {
    const longExcerpt = "B".repeat(160);
    const req = makeRequest({ title: "Title", excerpt: longExcerpt, slug: "test" });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("...");
  });

  it("builds siteUrl with blog path when slug provided", async () => {
    const req = makeRequest({ title: "Test", slug: "my-article" });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("juanpabloloaiza.com/blog/my-article");
  });

  it("uses base domain when no slug provided", async () => {
    const req = makeRequest({ title: "Test" });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("juanpabloloaiza.com");
    // Should not have /blog/ path without a slug
    const siteUrlMatch = element.match(/juanpabloloaiza\.com([^"'\s<]*)/);
    expect(siteUrlMatch?.[1] ?? "").not.toContain("blog/");
  });

  it("includes logo URL from origin", async () => {
    const req = makeRequest({ title: "Test", slug: "test" });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain("/assets/logo.webp");
  });

  it("includes background imageUrl in element when provided", async () => {
    const imgUrl = "https://cdn.example.com/blog/image.jpg";
    const req = makeRequest({ title: "Test", slug: "test", imageUrl: imgUrl });
    await GET(req as never);
    const element = MockImageResponse.lastElement;
    expect(element).toContain(imgUrl);
  });

  it("renders with 1080x1920 dimensions", async () => {
    const req = makeRequest({ title: "Test", slug: "test" });
    await GET(req as never);
    const options = MockImageResponse.lastOptions as { width: number; height: number };
    expect(options.width).toBe(1080);
    expect(options.height).toBe(1920);
  });
});
