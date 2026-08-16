import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isMissingRegistrationRpc,
  parseRegistrationApplyError,
} from "@/lib/utils/participant-party";

type RouteContext = { params: Promise<{ id: string }> };

type RegisterBody = {
  mode?: "solo" | "party";
  applyWeightClass?: string;
  applyExperience?: string;
  gymAffiliation?: string | null;
  applicantNotes?: string | null;
  companionUserIds?: string[];
};

const SOLO_BUSINESS_ERROR_CODES = [
  "ALREADY_REGISTERED",
  "LOGIN_REQUIRED",
  "WEIGHT_CLASS_REQUIRED",
  "EXPERIENCE_REQUIRED",
] as const;

function isSoloBusinessError(message: string): boolean {
  return SOLO_BUSINESS_ERROR_CODES.some((code) => message.includes(code));
}

type ResolvedRegistrationStatus = {
  status: "pending" | "approved";
  auto_approved: boolean;
};

async function resolveNewRegistrationStatus(
  eventId: string,
): Promise<ResolvedRegistrationStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_new_registration_status", {
    p_event_id: eventId,
  });

  if (error || !data || typeof data !== "object") {
    return { status: "pending", auto_approved: false };
  }

  const resolved = data as { status?: string; auto_approved?: boolean };
  const status = resolved.status === "approved" ? "approved" : "pending";

  return {
    status,
    auto_approved: status === "approved" && Boolean(resolved.auto_approved),
  };
}

function buildRegistrationRow(
  eventId: string,
  userId: string,
  body: RegisterBody,
  resolved: ResolvedRegistrationStatus,
) {
  return {
    event_id: eventId,
    user_id: userId,
    status: resolved.status,
    auto_approved: resolved.auto_approved,
    seeking_sparring_partner: false,
    apply_weight_class: body.applyWeightClass!.trim(),
    apply_experience: body.applyExperience!.trim(),
    gym_affiliation: body.gymAffiliation?.trim() || null,
    applicant_notes: body.applicantNotes?.trim() || null,
  };
}

async function insertRegistrationFallback(
  eventId: string,
  userId: string,
  body: RegisterBody,
): Promise<string | null> {
  const resolved = await resolveNewRegistrationStatus(eventId);
  const row = buildRegistrationRow(eventId, userId, body, resolved);
  const admin = createAdminClient();

  if (admin) {
    const { error: adminInsertError } = await admin.from("registrations").insert(row);
    if (!adminInsertError) {
      return null;
    }

    return adminInsertError.message;
  }

  if (resolved.status !== "pending") {
    return "자동 승인 신청은 서버 설정이 필요합니다. 잠시 후 다시 시도해주세요.";
  }

  const supabase = await createClient();
  const { error: userInsertError } = await supabase.from("registrations").insert(row);

  if (!userInsertError) {
    return null;
  }

  return userInsertError.message;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: eventId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const applyWeightClass = body.applyWeightClass?.trim() ?? "";
  const applyExperience = body.applyExperience?.trim() ?? "";

  if (!applyWeightClass) {
    return NextResponse.json({ error: "체급을 선택해주세요." }, { status: 400 });
  }

  if (!applyExperience) {
    return NextResponse.json(
      { error: "수련 정보를 확인해주세요." },
      { status: 400 },
    );
  }

  const mode = body.mode ?? "solo";
  const rpcBase = {
    p_event_id: eventId,
    p_apply_weight_class: applyWeightClass,
    p_apply_experience: applyExperience,
    p_gym_affiliation: body.gymAffiliation?.trim() || null,
    p_applicant_notes: body.applicantNotes?.trim() || null,
    p_seeking_sparring: false,
  };

  if (mode === "party") {
    const companionUserIds = body.companionUserIds ?? [];
    if (companionUserIds.length === 0) {
      return NextResponse.json(
        { error: "동행할 운동 친구를 1명 이상 선택해주세요." },
        { status: 400 },
      );
    }

    const { error: partyError } = await supabase.rpc("create_party_registration", {
      ...rpcBase,
      p_companion_user_ids: companionUserIds,
    });

    if (partyError) {
      return NextResponse.json(
        {
          error: parseRegistrationApplyError(
            partyError.message,
            "동행 신청에 실패했습니다.",
          ),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, mode: "party" });
  }

  const { error: rpcError } = await supabase.rpc(
    "create_solo_registration",
    rpcBase,
  );

  if (!rpcError) {
    return NextResponse.json({ success: true, mode: "solo" });
  }

  if (isSoloBusinessError(rpcError.message)) {
    return NextResponse.json(
      { error: parseRegistrationApplyError(rpcError.message) },
      { status: 400 },
    );
  }

  const shouldFallback =
    isMissingRegistrationRpc(rpcError.message) ||
    rpcError.message.includes("invalid input value for enum registration_status");

  if (!shouldFallback) {
    return NextResponse.json(
      { error: parseRegistrationApplyError(rpcError.message) },
      { status: 400 },
    );
  }

  const fallbackError = await insertRegistrationFallback(eventId, user.id, {
    ...body,
    applyWeightClass,
    applyExperience,
  });

  if (fallbackError) {
    return NextResponse.json(
      { error: parseRegistrationApplyError(fallbackError) },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, mode: "solo", fallback: true });
}
