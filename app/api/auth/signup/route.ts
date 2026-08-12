import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mapSignupError, sanitizeSignupMetadata } from "@/lib/utils/auth-errors";
import { normalizePhone } from "@/lib/utils/phone";
import { GYM_OPERATOR_EXPERIENCE } from "@/lib/constants/profile";
import { serializeRepresentativeRole } from "@/lib/constants/gym-representative";

type SignupBody = {
  email?: string;
  password?: string;
  profile?: Record<string, unknown>;
  isGymOperator?: boolean;
  gym?: {
    name?: string;
    address?: string;
    representativeName?: string;
    representativePhone?: string;
    representativeRole?: string;
    representativeRoleCustom?: string;
    region?: string;
  };
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

async function createCookieClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Route Handler에서는 setAll이 동작합니다.
        }
      },
    },
  });
}

export async function POST(request: Request) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json(
      {
        error:
          "Supabase 환경 변수가 없습니다. .env.local 파일을 확인하고 dev 서버를 재시작해주세요.",
      },
      { status: 500 },
    );
  }

  let body: SignupBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const profile = body.profile ?? {};

  if (!email || !password) {
    return NextResponse.json(
      { error: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const metadata = sanitizeSignupMetadata(profile);
  if (body.isGymOperator) {
    metadata.experience = GYM_OPERATOR_EXPERIENCE;
  }

  const signupResponse = await fetch(`${env.url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      data: metadata,
    }),
  });

  let signupPayload: {
    id?: string;
    email?: string;
    access_token?: string;
    refresh_token?: string;
    identities?: { id: string }[];
    user?: {
      id: string;
      email?: string;
      identities?: { id: string }[];
    };
    msg?: string;
    error_description?: string;
    message?: string;
    code?: string | number;
    error_code?: string;
  };

  try {
    signupPayload = await signupResponse.json();
  } catch {
    signupPayload = {};
  }

  if (!signupResponse.ok) {
    console.error("signup auth error:", {
      status: signupResponse.status,
      payload: signupPayload,
    });

    return NextResponse.json(
      {
        error: mapSignupError(
          signupPayload.error_code ?? signupPayload.msg ?? signupPayload,
        ),
      },
      { status: 400 },
    );
  }

  const user =
    signupPayload.user ??
    (signupPayload.id
      ? {
          id: signupPayload.id,
          email: signupPayload.email,
          identities: signupPayload.identities,
        }
      : null);

  const data = {
    user,
    session:
      signupPayload.access_token && signupPayload.refresh_token
        ? {
            access_token: signupPayload.access_token,
            refresh_token: signupPayload.refresh_token,
          }
        : null,
  };

  if (!data.user) {
    console.error("signup ok but no user in payload:", signupPayload);
    return NextResponse.json(
      { error: "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 400 },
    );
  }

  if (data.user.identities?.length === 0) {
    return NextResponse.json(
      {
        error:
          "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.",
      },
      { status: 400 },
    );
  }

  const supabase = await createCookieClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "서버 설정 오류입니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  if (data.session) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      console.error("signup session error:", sessionError);
      return NextResponse.json(
        { error: mapSignupError(sessionError) },
        { status: 400 },
      );
    }
  }

  if (body.isGymOperator && data.session && body.gym) {
    const rolePayload = serializeRepresentativeRole(
      body.gym.representativeRole ?? "",
      body.gym.representativeRoleCustom ?? "",
    );

    const { error: gymError } = await supabase.from("gyms").insert({
      owner_id: data.user.id,
      name: body.gym.name?.trim() ?? "",
      region: body.gym.region?.trim() || "미정",
      address: body.gym.address?.trim() ?? "",
      representative_name: body.gym.representativeName?.trim() ?? "",
      representative_phone: normalizePhone(body.gym.representativePhone ?? ""),
      ...rolePayload,
    });

    if (gymError) {
      console.error("signup gym error:", gymError);
      return NextResponse.json(
        { error: mapSignupError(gymError) },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      redirectTo: "/my/profile",
    });
  }

  if (data.session) {
    return NextResponse.json({
      success: true,
      hasSession: true,
      redirectTo: "/events",
    });
  }

  return NextResponse.json({
    success: true,
    hasSession: false,
    needsEmailConfirmation: true,
    isGymOperator: Boolean(body.isGymOperator),
  });
}
