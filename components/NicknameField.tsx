"use client";

import { useState } from "react";
import { SignupInput } from "@/components/SignupField";

type NicknameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  verifiedNickname: string | null;
  onVerifiedChange: (nickname: string | null) => void;
};

export function NicknameField({
  value,
  onChange,
  verifiedNickname,
  onVerifiedChange,
}: NicknameFieldProps) {
  const [checking, setChecking] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );

  const isVerified =
    verifiedNickname !== null && verifiedNickname === value.trim();

  function handleChange(nextValue: string) {
    onChange(nextValue);
    if (verifiedNickname !== null && verifiedNickname !== nextValue.trim()) {
      onVerifiedChange(null);
    }
    setMessage(null);
    setMessageType(null);
  }

  async function checkDuplicate() {
    const trimmed = value.trim();
    if (!trimmed) {
      setMessage("닉네임을 입력해주세요.");
      setMessageType("error");
      onVerifiedChange(null);
      return;
    }

    setChecking(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch("/api/nickname/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "닉네임 확인 중 오류가 발생했습니다.");
        setMessageType("error");
        onVerifiedChange(null);
        return;
      }

      if (!data.available) {
        setMessage(data.error ?? "사용할 수 없는 닉네임입니다.");
        setMessageType("error");
        onVerifiedChange(null);
        return;
      }

      onChange(data.nickname);
      onVerifiedChange(data.nickname);
      setMessage("사용 가능한 닉네임입니다.");
      setMessageType("success");
    } catch {
      setMessage("닉네임 확인 중 오류가 발생했습니다.");
      setMessageType("error");
      onVerifiedChange(null);
    } finally {
      setChecking(false);
    }
  }

  async function suggestNickname() {
    setSuggesting(true);
    setMessage(null);
    setMessageType(null);
    onVerifiedChange(null);

    try {
      const response = await fetch("/api/nickname/suggest");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "닉네임 추천 중 오류가 발생했습니다.");
        setMessageType("error");
        return;
      }

      onChange(data.nickname);

      const checkResponse = await fetch("/api/nickname/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: data.nickname }),
      });
      const checkData = await checkResponse.json();

      if (checkResponse.ok && checkData.available) {
        onVerifiedChange(checkData.nickname);
        setMessage("추천 닉네임이 확인되었습니다.");
        setMessageType("success");
        return;
      }

      setMessage("추천 닉네임입니다. 중복확인을 눌러주세요.");
      setMessageType("success");
    } catch {
      setMessage("닉네임 추천 중 오류가 발생했습니다.");
      setMessageType("error");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-900">
        닉네임
        <span className="text-orange-600"> *</span>
        <span className="ml-2 text-xs font-normal text-zinc-600">
          커뮤니티에서 공개적으로 사용하는 이름입니다.
        </span>
      </span>

      <button
        type="button"
        onClick={suggestNickname}
        disabled={suggesting}
        className="w-fit text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
      >
        {suggesting ? "추천 중..." : "무작위 닉네임 추천"}
      </button>

      <div className="relative">
        <SignupInput
          type="text"
          required
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="ex) 유도하는곰돌이"
          maxLength={20}
          autoComplete="nickname"
          className="pr-24"
        />
        <button
          type="button"
          onClick={checkDuplicate}
          disabled={checking || !value.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? "확인 중..." : "중복확인"}
        </button>
      </div>

      {isVerified && (
        <span className="text-xs font-medium text-green-600">확인 완료</span>
      )}

      {message && (
        <p
          className={`text-xs ${
            messageType === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
