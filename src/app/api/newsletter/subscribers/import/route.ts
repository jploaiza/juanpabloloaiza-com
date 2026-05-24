import { NextRequest, NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/auth";

export const dynamic = "force-dynamic";

interface ImportRow {
  email: string;
  name?: string;
  apellido?: string;
  tags?: string;
}

function parseCSV(text: string): ImportRow[] {
  // Handle BOM
  const cleaned = text.replace(/^﻿/, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  return lines.slice(1).map((line) => {
    // Simple CSV parse: handle quoted fields
    const values: string[] = [];
    let current = "";
    let inQuote = false;
    for (const char of line) {
      if (char === '"') { inQuote = !inQuote; continue; }
      if (char === "," && !inQuote) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());

    const row: ImportRow = { email: "" };
    headers.forEach((h, i) => {
      const v = values[i] ?? "";
      if (h === "email" || h === "correo") row.email = v.toLowerCase();
      else if (h === "name" || h === "nombre") row.name = v;
      else if (h === "apellido" || h === "last_name" || h === "lastname") row.apellido = v;
      else if (h === "tags" || h === "etiquetas") row.tags = v;
    });
    return row;
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireNewsletterAdmin();
  if ("error" in auth) return auth.error;

  const contentType = req.headers.get("content-type") ?? "";
  let rows: ImportRow[] = [];

  if (contentType.includes("application/json")) {
    const body = await req.json();
    rows = body.rows ?? [];
  } else {
    const text = await req.text();
    rows = parseCSV(text);
  }

  if (!rows.length) return NextResponse.json({ error: "No se encontraron filas válidas." }, { status: 400 });

  const MAX_ROWS = 10_000;
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Límite de ${MAX_ROWS} filas por importación.` }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let inserted = 0;
  let skipped = 0;
  const errors: Array<{ row: number; email: string; reason: string }> = [];
  const BATCH_SIZE = 500;

  const confirmedAt = new Date().toISOString();
  const validRows: Array<{ rowNum: number; record: Record<string, unknown> }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.email || !emailRegex.test(row.email)) {
      errors.push({ row: i + 2, email: row.email ?? "", reason: "Email inválido" });
      continue;
    }
    const tags = row.tags ? row.tags.split(/[;|,]/).map((t) => t.trim()).filter(Boolean) : [];
    validRows.push({
      rowNum: i + 2,
      record: {
        email: row.email,
        name: row.name ?? row.email.split("@")[0],
        apellido: row.apellido ?? "",
        status: "confirmed",
        source: "import",
        tags,
        confirmed_at: confirmedAt,
      },
    });
  }

  // Batch upserts (500 rows at a time) — counts rows written (insert OR update)
  let upserted = 0;
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    const { error } = await auth.adminSb
      .from("newsletter_subscribers")
      .upsert(batch.map((r) => r.record), { onConflict: "email", ignoreDuplicates: false });

    if (error) {
      batch.forEach((r) => errors.push({ row: r.rowNum, email: String(r.record.email), reason: "Error al procesar" }));
    } else {
      upserted += batch.length;
    }
  }

  // Log import
  await auth.adminSb.from("newsletter_imports").insert({
    filename: `import-${Date.now()}.csv`,
    total_rows: rows.length,
    inserted: upserted,
    skipped_duplicates: 0,
    errors,
    created_by: auth.userId,
  });

  return NextResponse.json({ ok: true, upserted, errors: errors.slice(0, 20) });
}
