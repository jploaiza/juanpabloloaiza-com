import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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

const IMAGE_PROMPT_SYSTEM = `You are an expert at writing prompts for AI image generation.
Given a blog article about spiritual therapy, hypnosis, and past-life regression,
write a cinematic, ultra-realistic image generation prompt in English.
Style: cinematic realistic photo, ultra-detailed, ethereal spiritual atmosphere, soft golden light, mystical depth, professional photography, 8k resolution.
Always end the prompt with: --ar 16:9
Avoid: text, people's faces, logos, violence, cartoons, illustrations.
Return ONLY the prompt, nothing else. Max 120 words.`;

export async function POST(req: NextRequest) {
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

  const missing = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL", "DEEPSEEK_API_KEY"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Variables faltantes: ${missing.join(", ")}` }, { status: 500 });
  }

  const { title, excerpt, content } = await req.json() as { title: string; excerpt?: string; content?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "Se requiere el título del artículo." }, { status: 400 });
  }

  // 1. Generate image prompt with DeepSeek
  let imagePrompt: string;
  try {
    const ai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
    const res = await ai.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 150,
      messages: [
        { role: "system", content: IMAGE_PROMPT_SYSTEM },
        { role: "user", content: `Title: ${title}\nExcerpt: ${excerpt ?? ""}\nContent preview: ${(content ?? "").slice(0, 500)}` },
      ],
    });
    imagePrompt = res.choices[0]?.message?.content?.trim() ?? title;
  } catch {
    imagePrompt = `${title}, spiritual healing, ethereal light, mystical atmosphere`;
  }

  // 2. Fetch image from Pollinations.ai
  const encodedPrompt = encodeURIComponent(imagePrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&enhance=true&seed=${Date.now() % 9999}`;

  let imageBuffer: Buffer;
  try {
    const imgRes = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) throw new Error(`Pollinations returned ${imgRes.status}`);
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error generando imagen: ${msg}` }, { status: 500 });
  }

  // 3. Upload to R2
  const key = `blog/ai-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000",
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error subiendo a R2: ${msg}` }, { status: 500 });
  }

  const url = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  return NextResponse.json({ url, prompt: imagePrompt });
}
