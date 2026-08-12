"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  FriendListItem,
  FriendRequestItem,
} from "@/lib/queries/friends";

type FriendsPageClientProps = {
  friends: FriendListItem[];
  requests: FriendRequestItem[];
  viewerId: string;
};

export function FriendsPageClient({
  friends,
  requests,
  viewerId,
}: FriendsPageClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respondToRequest(
    friendshipId: string,
    action: "accepted" | "rejected",
  ) {
    setLoadingId(friendshipId);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("friendships")
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq("id", friendshipId)
      .eq("addressee_id", viewerId);

    if (updateError) {
      setError("요청 처리에 실패했습니다.");
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">받은 요청</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">받은 친구 요청이 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {requests.map((request) => (
              <li
                key={request.friendshipId}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <FriendAvatar
                  photoUrl={request.photoUrl}
                  nickname={request.nickname}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/users/${request.userId}`}
                    className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                  >
                    {request.nickname}
                  </Link>
                  {request.sport && (
                    <p className="text-xs text-zinc-500">{request.sport}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={loadingId === request.friendshipId}
                    onClick={() =>
                      void respondToRequest(request.friendshipId, "accepted")
                    }
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === request.friendshipId}
                    onClick={() =>
                      void respondToRequest(request.friendshipId, "rejected")
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          친구 {friends.length}명
        </h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            이벤트 참가자 프로필에서 친구를 추가할 수 있습니다.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {friends.map((friend) => (
              <li key={friend.friendshipId}>
                <Link
                  href={`/users/${friend.userId}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <FriendAvatar
                    photoUrl={friend.photoUrl}
                    nickname={friend.nickname}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {friend.nickname}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {[friend.sport, friend.weightClass]
                        .filter(Boolean)
                        .join(" · ") || "회원"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FriendAvatar({
  photoUrl,
  nickname,
}: {
  photoUrl: string | null;
  nickname: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={nickname}
        className="size-10 shrink-0 rounded-full border border-zinc-200 object-cover"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg">
      👤
    </div>
  );
}
