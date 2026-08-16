"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { ToggleGroup } from "@/components/ToggleGroup";
import {
  PROFILE_VISIBILITY_FIELD_CONFIGS,
  PROFILE_VISIBILITY_LEVEL_OPTIONS,
  type ProfileVisibilityField,
  type ProfileVisibilityLevel,
} from "@/lib/constants/profile-visibility";
import { createClient } from "@/lib/supabase/client";
import { parseProfileVisibilitySettings } from "@/lib/utils/profile-visibility";

type ProfileVisibilitySettingsFormProps = {
  initialSettings: Record<ProfileVisibilityField, ProfileVisibilityLevel>;
};

export function ProfileVisibilitySettingsForm({
  initialSettings,
}: ProfileVisibilitySettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateField(field: ProfileVisibilityField, value: string) {
    setSettings((current) => ({
      ...current,
      [field]: value as ProfileVisibilityLevel,
    }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ visibility_settings: settings })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError("설정 저장에 실패했습니다.");
      return;
    }

    setSettings(parseProfileVisibilitySettings(settings));
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        프로필과 예정 참가자 정보에 표시되는 항목의 공개 범위를 설정합니다. 연락처는
        기본값이 비공개입니다.
      </p>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-5">
          {PROFILE_VISIBILITY_FIELD_CONFIGS.map((config) => (
            <div key={config.field} className="border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
              <ToggleGroup
                label={config.label}
                options={PROFILE_VISIBILITY_LEVEL_OPTIONS}
                value={settings[config.field]}
                onChange={(value) => updateField(config.field, value)}
              />
              {config.description && (
                <p className="mt-1 text-xs text-zinc-500">{config.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <Alert message={error} />}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-orange-600 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "공개 범위 저장"}
      </button>

      {saved && (
        <p className="text-sm text-green-700">설정이 저장되었습니다.</p>
      )}
    </form>
  );
}
