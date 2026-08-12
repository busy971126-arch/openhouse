import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkNicknameLocally,
  generateRandomNickname,
} from "@/lib/utils/nickname";

const MAX_ATTEMPTS = 20;

export async function GET() {
  const supabase = await createClient();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = generateRandomNickname();
    const localCheck = checkNicknameLocally(candidate);
    if (!localCheck.ok) continue;

    const { data, error } = await supabase.rpc("is_nickname_available", {
      p_nickname: localCheck.nickname,
    });

    if (error) {
      return NextResponse.json(
        { error: "닉네임 추천 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    if (data) {
      return NextResponse.json({ nickname: localCheck.nickname });
    }
  }

  return NextResponse.json(
    { error: "추천할 닉네임을 찾지 못했습니다. 직접 입력해주세요." },
    { status: 503 },
  );
}
