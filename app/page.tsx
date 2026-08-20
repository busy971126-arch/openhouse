import { createClient } from "@/lib/supabase/server";
import { HostHome } from "@/components/home/HostHome";
import { GuestHome, MemberHome } from "@/components/home/HomeContent";
import { PendingGymRegistrationBanner } from "@/components/home/PendingGymRegistrationBanner";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getMyPageData } from "@/lib/queries/my-page";
import { getPendingGymRegistration } from "@/lib/queries/pending-gym";

function HomePrivacyNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-xl bg-zinc-50 px-3.5 py-3 text-xs leading-relaxed text-zinc-500"
    >
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span>안전한 참가를 위해 필요한 정보만 이벤트 주최자에게 공유됩니다.</span>
    </p>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-6 py-2">
        <GuestHome />
        <HomePrivacyNotice />
      </div>
    );
  }

  const { isOperator, pendingApprovals, profile } = await getMyPageData(user.id);
  const pendingGym = isOperator
    ? null
    : await getPendingGymRegistration(user.id);

  const displayLabel =
    profile?.nickname?.trim() || profile?.displayName?.trim() || "회원";

  if (isOperator) {
    const { data: dashboard } = await getDashboardData(user.id);

    return (
      <div className="flex flex-col gap-6 py-2">
        <HostHome
          displayLabel={displayLabel}
          pendingApprovals={dashboard?.stats.pendingApprovals ?? pendingApprovals}
          tomorrowEvents={dashboard?.todos.tomorrowEvents ?? 0}
          allEvents={dashboard?.allEvents ?? []}
          operatingEvents={dashboard?.operatingEvents ?? []}
          gyms={dashboard?.gyms ?? []}
          stats={
            dashboard?.stats ?? {
              gymCount: 0,
              operatingEventCount: 0,
              totalApplications: 0,
              pendingApprovals: 0,
            }
          }
        />
        <HomePrivacyNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {pendingGym ? <PendingGymRegistrationBanner pendingGym={pendingGym} /> : null}
      <MemberHome displayLabel={displayLabel} />
      <HomePrivacyNotice />
    </div>
  );
}
