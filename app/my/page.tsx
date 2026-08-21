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

  const { profile, isOperator } = await getMyPageData(user.id);
  const { count: unreadNotifications } = await getUnreadNotificationCount(user.id);
  const displayLabel =
    profile?.nickname?.trim() || profile?.displayName?.trim() || "회원";

  return (
    <div>
      <header className="mb-8 border-b border-zinc-300 pb-5">
        <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">
          MY OPENHOUSE
        </p>
        <h1 className="mt-2 text-[28px] font-black leading-none tracking-[-0.035em] text-zinc-950">
          {displayLabel}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">내 활동과 계정을 관리합니다.</p>
      </header>

      <section>
        <p className="mb-1 text-[10px] font-black tracking-[0.16em] text-zinc-400">
          ACTIVITY
        </p>
        <MyMenuItem href="/my/profile" label="프로필" />
        <MyMenuItem href="/my/registrations" label="내 일정" />
        <MyMenuItem href="/my/interests" label="관심" />
        <MyMenuItem href="/my/friends" label="운동 친구" />
      </section>

      <section className="mt-8">
        <p className="mb-1 text-[10px] font-black tracking-[0.16em] text-zinc-400">
          HOST
        </p>
        {isOperator ? (
          <MyMenuItem
            href="/host/gyms"
            label="운영 관리"
            description="체육관과 이벤트를 관리합니다."
          />
        ) : (
          <MyMenuItem
            href="/gym/new"
            label="운영자 등록"
            description="체육관을 등록하고 이벤트를 열 수 있습니다."
          />
        )}
      </section>

      <section className="mt-8">
        <p className="mb-1 text-[10px] font-black tracking-[0.16em] text-zinc-400">
          ACCOUNT
        </p>
        <MyMenuItem
          href="/my/notifications"
          label="알림"
          badge={unreadNotifications > 0 ? `${unreadNotifications}건` : undefined}
        />
        <MyMenuItem href="/my/settings" label="설정" />
        <MyMenuItem href="/my/inquiries" label="문의하기" />
        <MyMenuItem href="/my/terms" label="약관" />
        <MyLogoutButton />
      </section>

      <section className="mt-8 border-t border-zinc-300 pt-2">
        <MyMenuItem
          href="/my/withdraw"
          label="회원 탈퇴"
          description="계정과 데이터를 영구 삭제합니다."
        />
      </section>
    </div>
  );
}
