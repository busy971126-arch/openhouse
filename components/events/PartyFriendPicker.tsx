"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFriendProfileLabel } from "@/lib/utils/friend-search";

const MAX_COMPANIONS = 5;

export type PartyFriendOption = {
  userId: string;
  label: string;
  sport: string | null;
  weightClass: string | null;
};

type PartyFriendPickerProps = {
  viewerId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function PartyFriendPicker({
  viewerId,
  selectedIds,
  onChange,
}: PartyFriendPickerProps) {
  const [friends, setFriends] = useState<PartyFriendOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFriends() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data: rows, error: friendshipError } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`)
        .order("created_at", { ascending: false });

      if (friendshipError) {
        setError("운동 친구 목록을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      if (!rows?.length) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const friendIds = rows.map((row) =>
        row.requester_id === viewerId ? row.addressee_id : row.requester_id,
      );

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, nickname, display_name, preferred_sports, weight_class",
        )
        .in("id", friendIds);

      if (profileError) {
        setError("운동 친구 목록을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile]),
      );

      setFriends(
        friendIds
          .map((friendId) => {
            const profile = profileMap.get(friendId);
            if (!profile) return null;

            return {
              userId: profile.id,
              label: formatFriendProfileLabel(
                profile.nickname,
                profile.display_name,
              ),
              sport: profile.preferred_sports?.[0] ?? null,
              weightClass: profile.weight_class,
            };
          })
          .filter((item): item is PartyFriendOption => item != null),
      );
      setLoading(false);
    }

    void loadFriends();
  }, [viewerId]);

  function toggleFriend(userId: string) {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
      return;
    }

    if (selectedIds.length >= MAX_COMPANIONS) {
      setError(`동행 인원은 최대 ${MAX_COMPANIONS}명까지 선택할 수 있습니다.`);
      return;
    }

    setError(null);
    onChange([...selectedIds, userId]);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-sm font-medium text-zinc-900">함께 신청할 운동 친구</p>
      <p className="mt-1 text-xs text-zinc-500">
        운동 친구 프로필의 체급·수련 정보로 함께 신청됩니다.
      </p>

      {loading && (
        <p className="mt-3 text-sm text-zinc-500">불러오는 중...</p>
      )}

      {!loading && friends.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-center">
          <p className="text-sm text-zinc-600">
            아직 운동 친구가 없습니다.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            운동 친구를 추가한 뒤 동행 신청을 할 수 있습니다.
          </p>
          <Link
            href="/my/friends"
            className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            운동 친구 추가하기
          </Link>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!loading && friends.length > 0 && (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {friends.map((friend) => {
            const checked = selectedIds.includes(friend.userId);

            return (
              <li key={friend.userId}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 hover:bg-zinc-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFriend(friend.userId)}
                    className="size-4 rounded border-zinc-300"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-900">
                      {friend.label}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {[friend.sport, friend.weightClass]
                        .filter(Boolean)
                        .join(" · ") || "프로필 정보 확인 필요"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
