import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileVisibilitySettingsForm } from "@/components/my/ProfileVisibilitySettingsForm";
import { createClient } from "@/lib/supabase/server";
import { parseProfileVisibilitySettings } from "@/lib/utils/profile-visibility";

export default async function ProfilePrivacySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/settings/privacy");

  const { data: profile } = await supabase
    .from("profiles")
    .select("visibility_settings")
    .eq("id", user.id)
    .maybeSingle();

  const settings = parseProfileVisibilitySettings(profile?.visibility_settings);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Link
        href="/my/settings"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 설정
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">개인정보 공개 범위</h1>
        <p className="mt-1 text-sm text-zinc-600">
          운동 친구에게만 공개할 정보를 선택할 수 있습니다.
        </p>
      </div>

      <ProfileVisibilitySettingsForm initialSettings={settings} />
    </div>
  );
}
