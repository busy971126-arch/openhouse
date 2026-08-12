import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "서버 설정이 완료되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가해주세요.",
      },
      { status: 500 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json(
      { error: "본인 확인을 위해 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  const verifyClient = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("account withdraw delete error:", deleteError);
    return NextResponse.json(
      { error: "회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
