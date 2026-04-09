import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ArticleContent from "@/app/blog/[slug]/ArticleContent";
import type { BlogPost } from "@/lib/blog-data";

vi.mock("framer-motion", () => ({
  motion: new Proxy({} as Record<string, unknown>, {
    get: (_t, tag: string) =>
      function MotionEl({ children, ...props }: Record<string, unknown>) {
        return <div {...(props as never)}>{children as never}</div>;
      },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Silence "not implemented" warnings for URL methods
URL.createObjectURL = vi.fn().mockReturnValue("blob://mock-url");
URL.revokeObjectURL = vi.fn();

const mockPost: BlogPost = {
  id: "1",
  slug: "test-article",
  title: "Test Article Title",
  excerpt: "A brief excerpt for testing.",
  content: "# Body\n\nSome text.",
  readTime: "3 min",
  category: "Regresión",
  image: "bg-gradient-to-br from-indigo-600 to-purple-900",
  imageUrl: "https://cdn.example.com/blog/test.jpg",
  date: "2026-01-15",
  author: "Juan Pablo Loaiza",
  url: "https://juanpabloloaiza.com/blog/test-article",
};

function makeFetch(ok = true) {
  const blob = new Blob(["fake-png-data"], { type: "image/png" });
  return vi.fn().mockResolvedValue(
    ok ? new Response(blob, { status: 200 }) : new Response(null, { status: 500 })
  );
}

function renderContent(overrides: Partial<BlogPost> = {}) {
  return render(
    <ArticleContent
      post={{ ...mockPost, ...overrides }}
      previousPost={null}
      nextPost={null}
      relatedPosts={[]}
    />
  );
}

describe("Historia IG button", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("renders at least one Historia IG button", () => {
    renderContent();
    const buttons = screen.getAllByText(/historia ig/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("opens modal with title and download button on success", async () => {
    global.fetch = makeFetch(true);
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(screen.getByText("Historia para Instagram")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /guardar imagen/i })).toBeInTheDocument();
  });

  it("shows step-by-step Instagram instructions in modal", async () => {
    global.fetch = makeFetch(true);
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => screen.getByText(/cómo compartir en instagram/i));
    expect(screen.getByText(/abre instagram/i)).toBeInTheDocument();
    expect(screen.getByText(/toca el ícono/i)).toBeInTheDocument();
  });

  it("calls /api/og/story with title, slug, excerpt and imageUrl", async () => {
    global.fetch = makeFetch(true);
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const calledUrl = new URL((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0], "http://localhost");
    expect(calledUrl.pathname).toBe("/api/og/story");
    expect(calledUrl.searchParams.get("title")).toBe(mockPost.title);
    expect(calledUrl.searchParams.get("slug")).toBe(mockPost.slug);
    expect(calledUrl.searchParams.get("excerpt")).toBe(mockPost.excerpt);
    expect(calledUrl.searchParams.get("imageUrl")).toBe(mockPost.imageUrl);
  });

  it("omits imageUrl param when post has no featured image", async () => {
    global.fetch = makeFetch(true);
    renderContent({ imageUrl: undefined });
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const calledUrl = new URL((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0], "http://localhost");
    expect(calledUrl.searchParams.has("imageUrl")).toBe(false);
  });

  it("closes modal when X button is clicked", async () => {
    global.fetch = makeFetch(true);
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => screen.getByText("Historia para Instagram"));
    // The X button is the one with aria-label pattern or near the modal title
    const closeButtons = screen.getAllByRole("button");
    const xBtn = closeButtons.find((b) =>
      b.closest("[class*='fixed']") && !b.textContent?.toLowerCase().includes("guardar")
    );
    expect(xBtn).toBeDefined();
    await act(async () => { fireEvent.click(xBtn!); });
    await waitFor(() => expect(screen.queryByText("Historia para Instagram")).not.toBeInTheDocument());
  });

  it("shows alert on API error", async () => {
    global.fetch = makeFetch(false);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Error")));
    alertSpy.mockRestore();
  });

  it("Guardar imagen button triggers file download", async () => {
    global.fetch = makeFetch(true);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderContent();
    const [btn] = screen.getAllByText(/historia ig/i);
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => screen.getByRole("button", { name: /guardar imagen/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar imagen/i }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
