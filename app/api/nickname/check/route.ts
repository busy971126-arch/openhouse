import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkNicknameLocally } from "@/lib/utils/nickname";

export async function POST(request: Request) {
  let body: { nickname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const localCheck = checkNicknameLocally(body.nickname ?? "");
  if (!localCheck.ok) {
    return NextResponse.json({ available: false, error: localCheck.error });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("is_nickname_available", {
    p_nickname: localCheck.nickname,
  });

  if (error) {
    return NextResponse.json(
      { error: "닉네임 확인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  if (!data && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();

    const current = profile?.nickname?.trim().toLowerCase();
    const requested = localCheck.nickname.toLowerCase();

    if (current && current === requested) {
      return NextResponse.json({
        available: true,
        nickname: localCheck.nickname,
      });
    }
  }

  if (!data) {
    return NextResponse.json({
      available: false,
      error: "이미 사용 중인 닉네임입니다.",
    });
  }

  return NextResponse.json({
    available: true,
    nickname: localCheck.nickname,
  });
}
