"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignupField, SignupInput } from "@/components/SignupField";
import {
  applyPostcodeResult,
  type GymAddressValue,
  type PostcodeResult,
} from "@/lib/utils/address-region";

const POSTCODE_SCRIPT_SRC =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type AddressSearchFieldProps = {
  value: GymAddressValue;
  onChange: (value: GymAddressValue) => void;
  required?: boolean;
};

function loadPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${POSTCODE_SCRIPT_SRC}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    document.body.appendChild(script);
  });
}

export function AddressSearchField({
  value,
  onChange,
  required,
}: AddressSearchFieldProps) {
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    loadPostcodeScript().catch(() => {
      setScriptError("주소 검색을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.");
    });
  }, []);

  const openSearch = useCallback(async () => {
    setScriptError(null);
    setLoading(true);

    try {
      await loadPostcodeScript();
      if (!window.daum?.Postcode) {
        throw new Error("Postcode unavailable");
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          onChange(
            applyPostcodeResult(valueRef.current, data as PostcodeResult),
          );
          setLoading(false);
        },
      }).open();
    } catch {
      setScriptError("주소 검색을 열 수 없습니다.");
      setLoading(false);
    }
  }, [onChange]);

  return (
    <div className="flex flex-col gap-4">
      <SignupField label="주소" required={required}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openSearch}
            disabled={loading}
            className="rounded-lg border border-orange-300 bg-orange-50 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {loading ? "불러오는 중..." : "주소 검색"}
          </button>

          {value.roadAddress ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800">
              {value.zonecode && (
                <p className="text-xs text-zinc-500">({value.zonecode})</p>
              )}
              <p>{value.roadAddress}</p>
              {value.region && (
                <p className="mt-1 text-xs text-orange-700">
                  활동 지역: {value.region}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              주소 검색 버튼을 눌러 도로명 주소를 입력해주세요.
            </p>
          )}
        </div>
      </SignupField>

      <SignupField label="상세 주소" hint="선택">
        <SignupInput
          value={value.addressDetail}
          onChange={(e) =>
            onChange({ ...value, addressDetail: e.target.value })
          }
          placeholder="예: 3층, 301호"
          disabled={!value.roadAddress}
        />
      </SignupField>

      {scriptError && <p className="text-sm text-red-600">{scriptError}</p>}
    </div>
  );
}
