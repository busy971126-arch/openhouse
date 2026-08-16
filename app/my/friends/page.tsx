import Link from "next/link";
import { redirect } from "next/navigation";
import { FriendsPageClient } from "@/components/profile/FriendsPageClient";
import { createClient } from "@/lib/supabase/server";
import {
  getFriendsList,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
} from "@/lib/queries/friends";

export default async function MyFriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/friends");

  const [friends, incomingRequests, outgoingRequests] = await Promise.all([
    getFriendsList(user.id),
    getIncomingFriendRequests(user.id),
    getOutgoingFriendRequests(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Link
        href="/my/profile"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 프로필
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900">운동 친구</h1>

      <FriendsPageClient
        friends={friends}
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
        viewerId={user.id}
      />
    </div>
  );
}
