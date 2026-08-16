"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { Alert } from "@/components/Alert";
import { AuthBrandHero } from "@/components/auth/AuthBrandHero";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { NicknameField } from "@/components/NicknameField";
import { SignupField, SignupInput } from "@/components/SignupField";
import { SignupSection } from "@/components/SignupSection";
import { ToggleGroup } from "@/components/ToggleGroup";
import { TreeMultiSelect } from "@/components/TreeMultiSelect";
import { REGION_TREE } from "@/lib/constants/regions";
import {
  buildExperience,
  EXPERIENCE_TYPE_OPTIONS,
  EXPERIENCE_YEARS_OPTIONS,
  GENDER_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
  getWeightClassOptionsForGender,
  isWeightClassValidForGender,
  resolveProfileExperience,
} from "@/lib/constants/profile";
import { SIGNUP_SPORT_OPTIONS } from "@/lib/constants/sports";
import {
  ageToAgeGroup,
  isTeensAgeInput,
  parseAge,
  validateAge,
} from "@/lib/utils/age";
import { formatPhoneInput, normalizePhone } from "@/lib/utils/phone";
import { RepresentativeRoleFields } from "@/components/gym/RepresentativeRoleFields";
import { validateRepresentativeRole } from "@/lib/constants/gym-representative";

export default function SignupPage() {
  const router = useRouter();
  const [preferredSports, setPreferredSports] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [experienceType, setExperienceType] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [isGymOperator, setIsGymOperator] = useState(false);
  const [gymName, setGymName] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [gymRepName, setGymRepName] = useState("");
  const [gymRepPhone, setGymRepPhone] = useState("");
  const [gymRepRole, setGymRepRole] = useState("");
  const [gymRepRoleCustom, setGymRepRoleCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const phoneRequired = isTeensAgeInput(ageInput);
  const weightClassOptions = useMemo(
    () => getWeightClassOptionsForGender(gender),
    [gender],
  );

  useEffect(() => {
    if (weightClass && !isWeightClassValidForGender(weightClass, gender)) {
      setWeightClass("");
    }
  }, [gender, weightClass]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!displayName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!gender) {
      setError("성별을 선택해주세요.");
      return;
    }

    const ageError = validateAge(ageInput);
    if (ageError) {
      setError(ageError);
      return;
    }

    if (isTeensAgeInput(ageInput) && !phone.trim()) {
      setError("10대는 본인 연락처 입력이 필수입니다.");
      return;
    }

    if (isTeensAgeInput(ageInput) && !parentPhone.trim()) {
      setError("10대는 부모님 연락처 입력이 필수입니다.");
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!verifiedNickname || verifiedNickname !== trimmedNickname) {
      setError("닉네임 중복확인을 완료해주세요.");
      return;
    }

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (preferredSports.length === 0) {
      setError("참여하고 싶은 스포츠를 선택해주세요.");
      return;
    }

    if (regions.length === 0) {
      setError("활동구역을 1개 이상 선택해주세요.");
      return;
    }

    if (!isGymOperator) {
      if (!experienceType) {
        setError("수련 배경을 선택해주세요.");
        return;
      }

      if (experienceType === "일반 수련자" && !experienceYears) {
        setError("수련 기간을 선택해주세요.");
        return;
      }
    }

    const experience = resolveProfileExperience(
      buildExperience(experienceType, experienceYears),
      isGymOperator,
    );
    if (!experience) {
      setError("수련 배경을 선택해주세요.");
      return;
    }

    if (isGymOperator) {
      if (!gymName.trim()) {
        setError("체육관명을 입력해주세요.");
        return;
      }
      if (!gymAddress.trim()) {
        setError("주소를 입력해주세요.");
        return;
      }
      if (!gymRepName.trim()) {
        setError("대표 이름을 입력해주세요.");
        return;
      }
      if (!gymRepPhone.trim()) {
        setError("대표 연락처를 입력해주세요.");
        return;
      }

      const roleError = validateRepresentativeRole(gymRepRole, gymRepRoleCustom);
      if (roleError) {
        setError(roleError);
        return;
      }
    }

    const age = parseAge(ageInput)!;
    const ageGroup = ageToAgeGroup(age);

    setLoading(true);

    const profileData = {
      display_name: displayName.trim(),
      nickname: verifiedNickname,
      gender,
      age,
      age_group: ageGroup,
      experience,
      weight_class: weightClass.trim() || null,
      phone: normalizePhone(phone),
      parent_phone: normalizePhone(parentPhone),
      regions,
      preferred_sports: preferredSports,
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          profile: profileData,
          isGymOperator,
          gym: isGymOperator
            ? {
                name: gymName.trim(),
                address: gymAddress.trim(),
                representativeName: gymRepName.trim(),
                representativePhone: gymRepPhone,
                representativeRole: gymRepRole,
                representativeRoleCustom: gymRepRoleCustom,
                region: regions[0] ?? "미정",
              }
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoading(false);
        setError(result.error ?? "회원가입에 실패했습니다.");
        return;
      }

      if (result.hasSession && result.redirectTo) {
        setLoading(false);
        window.alert("회원가입이 완료되었습니다.");
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setLoading(false);
      if (result.isGymOperator) {
        setSuccess(
          "회원가입이 완료되었습니다. 이메일 인증 후 로그인하면 체육관 정보 수정을 이어서 진행할 수 있습니다.",
        );
      } else {
        setSuccess(
          "회원가입이 완료되었습니다. 이메일함을 확인한 후 로그인해주세요.",
        );
      }
      window.alert("회원가입이 완료되었습니다.");
    } catch (cause) {
      setLoading(false);
      console.error("signup request error:", cause);
      setError(
        "회원가입 요청에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <AuthBrandHero />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">회원가입</h2>
        <p className="mt-1 text-xs text-zinc-600">
          안전한 참가를 위해 필요한 정보만 이벤트 주최자에게 공유됩니다.
        </p>
      </div>

      {error && (
        <div ref={errorRef} className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {success && (
        <div ref={successRef} className="mb-4">
          <Alert message={success} variant="success" />
          <p className="mt-3 text-center text-sm text-zinc-600">
            <Link href="/login" className="font-medium text-orange-600 underline">
              로그인 페이지로 이동
            </Link>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SignupSection title="기본 정보" note="호스트에게만 공개됩니다">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <SignupField label="이름 (실명)" required>
                <SignupInput
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="홍길동"
                  autoComplete="name"
                />
              </SignupField>
            </div>

            <div className="min-w-0">
              <SignupField label="나이" required hint="만 나이 기준">
                <SignupInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={2}
                  value={ageInput}
                  onChange={(e) =>
                    setAgeInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="25"
                  className="w-full"
                />
              </SignupField>
            </div>

            <div className="min-w-0">
              <ToggleGroup
                label="성별"
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
                required
              />
            </div>

            {phoneRequired ? (
              <>
                <p className="col-span-2 text-xs text-zinc-600">
                  10대는 본인 연락처와 부모님 연락처가 필요합니다.
                </p>

                <SignupField label="본인 연락처" required>
                  <SignupInput
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) =>
                      setPhone(formatPhoneInput(e.target.value))
                    }
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </SignupField>

                <SignupField label="부모님 연락처" required>
                  <SignupInput
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) =>
                      setParentPhone(formatPhoneInput(e.target.value))
                    }
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </SignupField>
              </>
            ) : (
              <div className="col-span-2">
                <SignupField label="연락처">
                  <SignupInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </SignupField>
              </div>
            )}
          </div>
        </SignupSection>

        <SignupSection title="계정 정보">
          <NicknameField
            value={nickname}
            onChange={setNickname}
            verifiedNickname={verifiedNickname}
            onVerifiedChange={setVerifiedNickname}
          />

          <SignupField label="이메일" required>
            <SignupInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </SignupField>

          <SignupField label="비밀번호" required hint="8자 이상">
            <SignupInput
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </SignupField>

          <SignupField label="비밀번호 확인" required>
            <SignupInput
              type="password"
              required
              minLength={8}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </SignupField>
        </SignupSection>

        <SignupSection title="운동 정보">
          <ChipMultiSelect
            label="참여하고 싶은 스포츠"
            options={SIGNUP_SPORT_OPTIONS}
            values={preferredSports}
            onChange={setPreferredSports}
            single
            required
          />

          <TreeMultiSelect
            label="활동구역"
            labelNote="복수 선택 가능"
            nodes={REGION_TREE}
            values={regions}
            onChange={setRegions}
            exclusiveValue="전국"
            required
          />

          {isGymOperator ? (
            <SignupField label="수련 배경">
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-800">
                {GYM_OPERATOR_EXPERIENCE}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                체육관 운영자는 지도자로 등록됩니다.
              </p>
            </SignupField>
          ) : (
            <>
              <ToggleGroup
                label="수련 배경"
                options={EXPERIENCE_TYPE_OPTIONS}
                value={experienceType}
                onChange={(value) => {
                  setExperienceType(value);
                  if (value !== "일반 수련자") setExperienceYears("");
                }}
                required
              />

              {experienceType === "일반 수련자" && (
                <ToggleGroup
                  label="수련 기간"
                  options={EXPERIENCE_YEARS_OPTIONS}
                  value={experienceYears}
                  onChange={setExperienceYears}
                  required
                />
              )}

              {experienceType === "엘리트 선수" && (
                <p className="-mt-2 text-xs text-zinc-600">
                  예: 초·중·고·대표, 등록 선수
                </p>
              )}
            </>
          )}

          <ToggleGroup
            label="체급"
            options={weightClassOptions}
            value={weightClass}
            onChange={setWeightClass}
          />
          {!gender ? (
            <p className="-mt-1 text-xs text-zinc-500">
              성별을 선택하면 해당 체급이 표시됩니다.
            </p>
          ) : (
            <p className="-mt-1 text-xs text-zinc-500">
              {gender === "여성" ? "여성" : "남성"} 유도 체급 · 대련 상대 찾기에
              사용됩니다.
            </p>
          )}
        </SignupSection>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isGymOperator}
              onChange={(e) => setIsGymOperator(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-orange-600"
            />
            <span className="text-sm font-semibold text-zinc-900">
              체육관 운영자입니다.
            </span>
          </label>

          {isGymOperator && (
            <div className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4">
              <p className="text-xs text-zinc-600">
                체육관을 등록하면 이벤트를 만들고 예정 참가자를 관리할 수 있습니다.
              </p>

              <SignupField label="체육관명" required>
                <SignupInput
                  type="text"
                  required={isGymOperator}
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                />
              </SignupField>

              <SignupField label="주소" required>
                <SignupInput
                  type="text"
                  required={isGymOperator}
                  value={gymAddress}
                  onChange={(e) => setGymAddress(e.target.value)}
                  placeholder="도로명 주소"
                />
              </SignupField>

              <SignupField label="담당자 이름" required>
                <SignupInput
                  type="text"
                  required={isGymOperator}
                  value={gymRepName}
                  onChange={(e) => setGymRepName(e.target.value)}
                  autoComplete="name"
                />
              </SignupField>

              <RepresentativeRoleFields
                role={gymRepRole}
                onRoleChange={setGymRepRole}
                customRole={gymRepRoleCustom}
                onCustomRoleChange={setGymRepRoleCustom}
              />

              <SignupField label="담당자 연락처" required>
                <SignupInput
                  type="tel"
                  required={isGymOperator}
                  value={gymRepPhone}
                  onChange={(e) =>
                    setGymRepPhone(formatPhoneInput(e.target.value))
                  }
                  placeholder="010-0000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </SignupField>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-700">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-orange-600">
          로그인
        </Link>
      </p>
    </div>
  );
}
