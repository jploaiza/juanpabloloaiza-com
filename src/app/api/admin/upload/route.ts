import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function hasValidMagicBytes(buf: Buffer, mimeType: string): boolean {
  if (buf.length < 4) return false;
  switch (mimeType) {
    case "image/jpeg": return buf[0] === 0xff && buf[1] === 0xd8;
    case "image/png": return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/gif": return buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a";
    case "image/webp": return buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif": return true; // ISO BMFF container — complex to validate, trust ALLOWED_TYPES check
    default: return false;
  }
}

export async function POST(req: NextRequest) {
  // CSRF: verify request originates from own site
  const origin = req.headers.get("origin");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.juanpabloloaiza.com").replace(/\/$/, "");
  if (origin && origin !== siteUrl) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME ||
    !process.env.R2_PUBLIC_URL
  ) {
    return NextResponse.json(
      { error: "R2 not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL to your environment variables." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 10 MB)." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasValidMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "Contenido del archivo no coincide con el tipo declarado." }, { status: 400 });
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );
  } catch (err) {
    console.error("[upload] R2 error:", err);
    return NextResponse.json(
      { error: "Error al subir a R2. Verifica credenciales y bucket." },
      { status: 500 }
    );
  }

  const url = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  return NextResponse.json({ url });
}
