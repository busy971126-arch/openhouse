import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPageData } from "@/lib/queries/my-page";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { MyLogoutButton } from "@/components/my/MyLogoutButton";
import { MyMenuItem } from "@/components/my/MyMenuItem";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my");

  const { profile } = await getMyPageData(user.id);
  const { count: unreadNotifications } = await getUnreadNotificationCount(user.id);
  const displayLabel =
    profile?.nickname?.trim() || profile?.displayName?.trim() || "회원";

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900">마이페이지</h1>
        <p className="mt-1 text-sm text-zinc-600">{displayLabel}님, 안녕하세요.</p>
      </div>

      <MyMenuItem href="/my/profile" label="🥋 프로필" />
      <MyMenuItem href="/my/friends" label="🤝 친구" />
      <MyMenuItem href="/my/registrations" label="📅 내 일정" />
      <MyMenuItem href="/my/wishlist" label="❤️ 관심 체육관" />

      <MyMenuItem
        href="/my/notifications"
        label="🔔 알림"
        badge={unreadNotifications > 0 ? `${unreadNotifications}건` : undefined}
      />
      <MyMenuItem href="/my/settings" label="⚙️ 설정" />
      <MyMenuItem href="/my/terms" label="📄 약관" />

      <div className="mt-4 pt-2">
        <MyLogoutButton label="🚪 로그아웃" />
      </div>

      <MyMenuItem
        href="/my/withdraw"
        label="🗑 회원 탈퇴"
        description="완전 삭제는 준비 중 · 로그아웃만 가능"
      />
    </div>
  );
}
