import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getFollowedGymUpcomingEvents,
  getUserGymFollows,
} from "@/lib/queries/participant-preview";
import { formatEventDate } from "@/lib/utils/date";

export default async function MyWishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/wishlist");

  const { data: follows } = await getUserGymFollows(user.id);
  const gymIds = (follows ?? []).map((item) => item.gym_id);
  const { data: upcomingEvents } = await getFollowedGymUpcomingEvents(gymIds);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">관심 체육관</h1>
      <p className="text-sm text-zinc-600">
        관심 등록한 체육관의 새 일정은 알림으로 받을 수 있습니다.
      </p>

      {!follows?.length ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          관심 등록한 체육관이 없습니다. 이벤트 상세 페이지에서 체육관을
          관심 등록해보세요.
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">관심 체육관</h2>
            <ul className="mt-3 space-y-3">
              {follows.map((item) => {
                const gym = Array.isArray(item.gyms)
                  ? item.gyms[0]
                  : item.gyms;
                if (!gym || typeof gym !== "object") return null;

                const gymData = gym as {
                  id: string;
                  name: string;
                  region: string;
                  sport: string;
                  photo_url: string | null;
                };

                return (
                  <li key={item.gym_id}>
                    <Link
                      href={`/gym/${gymData.id}`}
                      className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100"
                    >
                    {gymData.photo_url ? (
                      <img
                        src={gymData.photo_url}
                        alt={gymData.name}
                        className="size-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-200 text-lg">
                        🏢
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">{gymData.name}</p>
                      <p className="text-sm text-zinc-600">
                        {gymData.sport} · {gymData.region}
                      </p>
                    </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">다가오는 일정</h2>
            {!upcomingEvents?.length ? (
              <p className="mt-2 text-sm text-zinc-500">
                관심 체육관의 예정된 일정이 없습니다.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcomingEvents.map((event) => {
                  const gymRaw = event.gyms;
                  const gym =
                    gymRaw && typeof gymRaw === "object" && !Array.isArray(gymRaw)
                      ? (gymRaw as { name: string })
                      : Array.isArray(gymRaw)
                        ? (gymRaw[0] as { name: string } | undefined)
                        : undefined;
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="block rounded-lg border border-zinc-200 px-3 py-3 hover:bg-zinc-50"
                      >
                        <p className="font-medium text-zinc-900">{event.title}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {formatEventDate(event.event_date)} · {event.region}
                        </p>
                        {gym && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {gym.name}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
