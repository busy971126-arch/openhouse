import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">📢 오늘의 알림</h2>
        {unreadCount > 1 && (
          <Link
            href="/my/notifications"
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            +{unreadCount - 1}건 더
          </Link>
        )}
      </div>
      <Link
        href={href}
        className={`block px-4 py-3 hover:bg-zinc-50 ${
          isUnread ? "bg-orange-50/40" : ""
        }`}
      >
        <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
        {notification.body && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
            {notification.body}
          </p>
        )}
        <span className="mt-2 inline-block text-xs font-medium text-orange-600">
          확인 →
        </span>
      </Link>
    </section>
  );
}
