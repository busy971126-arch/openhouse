import { createClient } from "@/lib/supabase/server";
import { HostHome } from "@/components/home/HostHome";
import { GuestHome, MemberHome } from "@/components/home/HomeContent";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getMyPageData } from "@/lib/queries/my-page";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-6 py-2">
        <GuestHome />
        <p className="text-center text-xs text-zinc-500">
          안전한 참가를 위해 필요한 정보만 이벤트 주최자에게 공유됩니다.
        </p>
      </div>
    );
  }

  const { isOperator, pendingApprovals, profile } = await getMyPageData(user.id);

  const displayLabel =
    profile?.nickname?.trim() || profile?.displayName?.trim() || "회원";

  if (isOperator) {
    const { data: dashboard } = await getDashboardData(user.id);

    return (
      <div className="flex flex-col gap-6 py-2">
        <HostHome
          displayLabel={displayLabel}
          pendingApprovals={pendingApprovals}
          operatingEvents={dashboard?.operatingEvents ?? []}
          gyms={dashboard?.gyms ?? []}
        />
        <p className="text-center text-xs text-zinc-500">
          안전한 참가를 위해 필요한 정보만 이벤트 주최자에게 공유됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <MemberHome displayLabel={displayLabel} />
      <p className="text-center text-xs text-zinc-500">
        안전한 참가를 위해 필요한 정보만 이벤트 주최자에게 공유됩니다.
      </p>
    </div>
  );
}
