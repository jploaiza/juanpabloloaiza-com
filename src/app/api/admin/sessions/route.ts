import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

async function getAdminOrFail(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const adminSb = await createAdminClient();
  const { data: profile } = await adminSb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { adminSb };
}

export async function POST(request: NextRequest) {
  const result = await getAdminOrFail(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { adminSb } = result;

  let body: {
    packId: string;
    userId: string;
    scheduledAt: string;
    status: string;
    therapistNotes?: string | null;
    progressScore?: number | null;
    topic?: string | null;
    followUpRequired?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    packId,
    userId,
    scheduledAt,
    status,
    therapistNotes,
    progressScore,
    topic,
    followUpRequired,
  } = body;

  if (!packId || !userId || !scheduledAt || !status) {
    return NextResponse.json(
      { error: "packId, userId, scheduledAt, status are required" },
      { status: 400 }
    );
  }

  const validStatuses = ["scheduled", "completed", "cancelled", "rescheduled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const { data: session, error: insertError } = await adminSb
    .from("therapy_sessions")
    .insert({
      pack_id: packId,
      user_id: userId,
      scheduled_at: scheduledAt,
      status,
      therapist_notes: therapistNotes ?? null,
      progress_score: progressScore ?? null,
      topic: topic ?? null,
      follow_up_required: followUpRequired ?? false,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Session insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // If completed, increment sessions_used on the pack
  if (status === "completed") {
    const { data: pack } = await adminSb
      .from("patient_packs")
      .select("sessions_used, sessions_total")
      .eq("id", packId)
      .single();

    if (pack) {
      const newUsed = pack.sessions_used + 1;
      const packUpdate: Record<string, unknown> = { sessions_used: newUsed };

      // Deactivate pack if all sessions used
      if (newUsed >= pack.sessions_total) {
        packUpdate.is_active = false;

        // Update patient status to inactive
        await adminSb
          .from("profiles")
          .update({ patient_status: "inactive" })
          .eq("id", userId);
      }

      await adminSb.from("patient_packs").update(packUpdate).eq("id", packId);
    }
  }

  return NextResponse.json(session, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const result = await getAdminOrFail(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { adminSb } = result;

  let body: {
    id: string;
    status?: string;
    therapistNotes?: string | null;
    progressScore?: number | null;
    followUpRequired?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status, therapistNotes, progressScore, followUpRequired } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updateFields: Record<string, unknown> = {};
  if (status !== undefined) updateFields.status = status;
  if (therapistNotes !== undefined) updateFields.therapist_notes = therapistNotes;
  if (progressScore !== undefined) updateFields.progress_score = progressScore;
  if (followUpRequired !== undefined) updateFields.follow_up_required = followUpRequired;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await adminSb
    .from("therapy_sessions")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Session update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Handle status change to completed — increment sessions_used
  if (status === "completed" && updated) {
    const { data: pack } = await adminSb
      .from("patient_packs")
      .select("sessions_used, sessions_total, user_id")
      .eq("id", updated.pack_id)
      .single();

    if (pack) {
      const newUsed = pack.sessions_used + 1;
      const packUpdate: Record<string, unknown> = { sessions_used: newUsed };

      if (newUsed >= pack.sessions_total) {
        packUpdate.is_active = false;
        await adminSb
          .from("profiles")
          .update({ patient_status: "inactive" })
          .eq("id", pack.user_id);
      }

      await adminSb.from("patient_packs").update(packUpdate).eq("id", updated.pack_id);
    }
  }

  return NextResponse.json(updated);
}
