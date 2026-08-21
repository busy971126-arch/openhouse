import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils/phone";
import { getRegistrationApplyBlockMessage } from "@/lib/utils/event-status";
import {
  isMissingRegistrationRpc,
  parseRegistrationApplyError,
} from "@/lib/utils/participant-party";

type RouteContext = { params: Promise<{ id: string }> };

type RegisterBody = {
  mode?: "solo" | "party";
  applicantName?: string;
  applicantPhone?: string;
  applicantGender?: string;
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
  "EVENT_NOT_FOUND",
  "EVENT_CANCELLED",
  "REGISTRATION_CLOSED",
] as const;

function isSoloBusinessError(message: string): boolean {
  return SOLO_BUSINESS_ERROR_CODES.some((code) => message.includes(code));
}

function buildPendingRegistrationRow(
  eventId: string,
  userId: string,
  body: RegisterBody,
) {
  return {
    event_id: eventId,
    user_id: userId,
    status: "pending" as const,
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
  const row = buildPendingRegistrationRow(eventId, userId, body);
  const admin = createAdminClient();

  if (admin) {
    const { error: adminInsertError } = await admin.from("registrations").insert(row);
    if (!adminInsertError) {
      return null;
    }

    return adminInsertError.message;
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

  const applicantName = body.applicantName?.trim() ?? "";
  const applicantPhone = normalizePhone(body.applicantPhone ?? "") ?? "";
  const applicantGender = body.applicantGender?.trim() ?? "";
  const applyWeightClass = body.applyWeightClass?.trim() ?? "";
  const applyExperience = body.applyExperience?.trim() ?? "";
  const phoneDigits = applicantPhone.replace(/\D/g, "");

  if (!applicantName) {
    return NextResponse.json({ error: "실명을 입력해주세요." }, { status: 400 });
  }

  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json(
      { error: "연락처를 올바르게 입력해주세요." },
      { status: 400 },
    );
  }

  if (applicantGender !== "남성" && applicantGender !== "여성") {
    return NextResponse.json({ error: "성별을 선택해주세요." }, { status: 400 });
  }

  if (!applyWeightClass) {
    return NextResponse.json({ error: "체급을 선택해주세요." }, { status: 400 });
  }

  if (!applyExperience) {
    return NextResponse.json(
      { error: "수련 정보를 확인해주세요." },
      { status: 400 },
    );
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, registration_deadline, recruitment_closed, status")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json(
      { error: "이벤트를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  if (!event) {
    return NextResponse.json(
      { error: "이벤트를 찾을 수 없습니다." },
      { status: 400 },
    );
  }

  const closedMessage = getRegistrationApplyBlockMessage(event);
  if (closedMessage) {
    return NextResponse.json({ error: closedMessage }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: applicantName,
      phone: applicantPhone,
      gender: applicantGender,
      weight_class: applyWeightClass,
      experience: applyExperience,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("registration profile save error:", profileError);
    return NextResponse.json(
      { error: "참가 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
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
    applicantName,
    applicantPhone,
    applicantGender,
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
