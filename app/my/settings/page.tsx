import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationSettingsForm } from "@/components/my/NotificationSettingsForm";
import { getUserProviders } from "@/lib/auth/providers";
import { createClient } from "@/lib/supabase/server";

export default async function MySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/settings");

  const providers = getUserProviders(user);
  const hasEmailPassword = providers.has("email");
  const hasKakao = providers.has("kakao");

  const { data: profile } = await supabase
    .from("profiles")
    .select("notify_new_events")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">설정</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">로그인 수단</p>
        <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-700">
          {hasKakao && (
            <div className="flex items-center justify-between">
              <span>🟨 카카오</span>
              <span className="text-xs font-medium text-green-700">연결됨</span>
            </div>
          )}
          {hasEmailPassword && (
            <div className="flex items-center justify-between">
              <span>✉️ 이메일</span>
              <span className="text-xs font-medium text-green-700">연결됨</span>
            </div>
          )}
          {!hasKakao && !hasEmailPassword && (
            <p className="text-zinc-500">로그인 수단을 확인할 수 없습니다.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/my/profile/edit"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
        >
          프로필 수정
        </Link>
        {hasEmailPassword && (
          <Link
            href="/my/settings/password"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
          >
            비밀번호 변경
          </Link>
        )}
        <Link
          href="/my/settings/privacy"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
        >
          개인정보 공개 범위
        </Link>
        <Link
          href="/my/inquiries"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
        >
          문의하기
        </Link>
      </div>

      <NotificationSettingsForm
        initialEnabled={profile?.notify_new_events ?? true}
      />

      <p className="text-xs text-zinc-500">
        관심 지역·종목은 프로필 수정에서 변경할 수 있습니다. 관심 체육관·이벤트는{" "}
        <Link href="/my/interests" className="text-orange-600 underline">
          관심 목록
        </Link>
        에서 관리합니다.
      </p>
    </div>
  );
}
