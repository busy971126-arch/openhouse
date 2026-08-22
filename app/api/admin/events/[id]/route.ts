import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  ADMIN_GENERIC_ERROR,
  parseEventAdminActionPatch,
} from "@/lib/admin/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { user, isAdmin, supabase } = await getAdminViewer();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseEventAdminActionPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await supabase.rpc("admin_moderate_event", {
    p_event_id: id,
    p_action: parsed.action,
    p_reason: parsed.reason,
  });

  if (error) {
    console.error("admin event moderate:", error.message);
    if (
      error.message.includes("올바른") ||
      error.message.includes("사유") ||
      error.message.includes("이미") ||
      error.message.includes("아닙니다") ||
      error.message.includes("찾을 수 없습니다")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: ADMIN_GENERIC_ERROR }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
