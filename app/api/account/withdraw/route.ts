import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getPreferredReauthProvider } from "@/lib/auth/providers";
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

  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    // 소셜 로그인 계정은 비밀번호 없이 탈퇴 요청을 보낼 수 있습니다.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const reauthProvider = getPreferredReauthProvider(user);

  if (reauthProvider === "email") {
    const password = body.password ?? "";
    if (!password) {
      return NextResponse.json(
        { error: "본인 확인을 위해 비밀번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "이메일 로그인 정보를 확인할 수 없습니다." },
        { status: 400 },
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
  } else if (reauthProvider === "kakao") {
    const cookieStore = await cookies();
    const verifiedUserId = cookieStore.get(
      "oh_withdraw_reauth_verified",
    )?.value;

    if (verifiedUserId !== user.id) {
      return NextResponse.json(
        { error: "카카오 계정으로 본인 확인을 다시 진행해주세요." },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "현재 로그인 방식의 회원 탈퇴는 아직 지원하지 않습니다." },
      { status: 400 },
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

  const response = NextResponse.json({ success: true });
  response.cookies.delete("oh_withdraw_reauth_expected");
  response.cookies.delete("oh_withdraw_reauth_verified");
  return response;
}
