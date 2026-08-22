import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  ADMIN_GENERIC_ERROR,
  parseReportAdminPatch,
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
  const parsed = parseReportAdminPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: current, error: loadError } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !current) {
    return NextResponse.json({ error: "신고를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: parsed.status,
      resolved_at: parsed.resolvedAt,
    })
    .eq("id", id);

  if (error) {
    console.error("admin report update:", error.message);
    return NextResponse.json({ error: ADMIN_GENERIC_ERROR }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
