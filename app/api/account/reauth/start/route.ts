import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProviders } from "@/lib/auth/providers";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const providers = getUserProviders(user);
  if (!providers.has("kakao")) {
    return NextResponse.json(
      { error: "카카오 로그인 계정에서만 사용할 수 있습니다." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("oh_withdraw_reauth_expected", user.id, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  response.cookies.delete("oh_withdraw_reauth_verified");

  return response;
}
