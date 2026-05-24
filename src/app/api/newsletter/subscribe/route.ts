import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, apellido, email } = await req.json();

    if (!name?.trim() || !apellido?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({
      name: name.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Este email ya está suscrito." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 });
  }
}
