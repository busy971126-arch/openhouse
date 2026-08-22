import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  parseInquiryStatus,
  resolveInquiryReplyStatus,
} from "@/lib/utils/admin";

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

  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    adminReply?: unknown;
  } | null;

  const { data: current, error: loadError } = await supabase
    .from("inquiries")
    .select("id, status, admin_reply")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !current) {
    return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  }

  const reply =
    typeof body?.adminReply === "string" ? body.adminReply.trim() : current.admin_reply ?? "";
  const nextStatus = resolveInquiryReplyStatus(
    current.status,
    parseInquiryStatus(body?.status),
    reply,
  );

  const { error } = await supabase
    .from("inquiries")
    .update({
      status: nextStatus,
      admin_reply: reply || null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
