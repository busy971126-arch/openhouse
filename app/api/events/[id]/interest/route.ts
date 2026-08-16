import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: existing, error: selectError } = await supabase
    .from("event_interests")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("event_interests")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ interested: false });
  }

  const { error: insertError } = await supabase.from("event_interests").insert({
    user_id: user.id,
    event_id: eventId,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ interested: true });
}
