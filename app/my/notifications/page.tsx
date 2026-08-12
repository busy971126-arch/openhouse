import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserNotifications } from "@/lib/queries/notifications";
import { NotificationList } from "@/components/my/NotificationList";

export default async function MyNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/notifications");

  const { data: notifications } = await getUserNotifications(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-900">알림</h1>
      <NotificationList notifications={notifications ?? []} />
    </div>
  );
}
