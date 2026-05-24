import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "confirmed";

  let query = auth.adminSb
    .from("newsletter_subscribers")
    .select("name, apellido, email, status, tags, source, confirmed_at, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const subscribers = data ?? [];
  const headers = ["name", "apellido", "email", "status", "tags", "source", "confirmed_at", "created_at"];
  const csvLines = [
    headers.join(","),
    ...subscribers.map((s) =>
      [
        `"${s.name ?? ""}"`,
        `"${s.apellido ?? ""}"`,
        `"${s.email}"`,
        s.status,
        `"${(s.tags ?? []).join("|")}"`,
        s.source ?? "web",
        s.confirmed_at ? new Date(s.confirmed_at).toISOString().split("T")[0] : "",
        new Date(s.created_at).toISOString().split("T")[0],
      ].join(",")
    ),
  ];
  const csv = csvLines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suscriptores-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
