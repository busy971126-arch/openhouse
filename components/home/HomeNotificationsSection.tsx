import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AppIcon } from "@/components/ui/AppIcon";
import { createClient } from "@/lib/supabase/server";
import { getHomeNotificationPreview } from "@/lib/queries/notifications";

export function HomeNotificationsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeNotifications />
    </Suspense>
  );
}

async function HomeNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { notification, unreadCount } = await getHomeNotificationPreview(user.id);

  if (!notification) return null;

  const href = notification.link ?? "/my/notifications";
  const isUnread = !notification.read_at;

  return (
    <section className="border-t border-zinc-200 pt-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">NOTICE</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-bold tracking-[-0.02em] text-zinc-950">
            <AppIcon name="bell" className="size-4 text-orange-600" />
            알림
          </h2>
        </div>
        {unreadCount > 1 && (
          <Link
            href="/my/notifications"
            className="text-xs font-semibold text-zinc-500 hover:text-orange-600"
          >
            +{unreadCount - 1}건
          </Link>
        )}
      </div>
      <Link
        href={href}
        className={`mt-3 block border-l-2 py-1 pl-4 transition ${
          isUnread ? "border-orange-600" : "border-zinc-300"
        }`}
      >
        <p className="text-sm font-bold text-zinc-950">{notification.title}</p>
        {notification.body && (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-600">
            {notification.body}
          </p>
        )}
        <span className="mt-2 inline-block text-xs font-semibold text-zinc-500">
          자세히 보기 →
        </span>
      </Link>
    </section>
  );
}
