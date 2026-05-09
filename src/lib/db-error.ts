import { NextResponse } from "next/server";

type DbErr = { code?: string; message?: string };

export function dbErr(context: string, err: DbErr, status = 500): NextResponse {
  console.error(`[${context}]`, err.code ?? err.message);
  return NextResponse.json({ error: "Internal server error" }, { status });
}
