"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FriendAddButton } from "@/components/profile/FriendAddButton";
import { createClient } from "@/lib/supabase/client";
import type { FriendshipState } from "@/lib/queries/friends";
import {
  buildFriendshipPairsFilter,
  formatFriendProfileLabel,
  formatFriendProfileSubtitle,
  resolveFriendshipStateFromRows,
} from "@/lib/utils/friend-search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 10;

type SearchResult = {
  userId: string;
  label: string;
  nickname: string | null;
  displayName: string | null;
  sport: string | null;
  photoUrl: string | null;
  weightClass: string | null;
  friendshipState: FriendshipState;
};

type SearchProfileRow = {
  id: string;
  nickname: string | null;
  display_name: string | null;
  preferred_sports: string[] | null;
  photo_url: string | null;
  weight_class: string | null;
};

type FriendUserSearchProps = {
  viewerId: string;
};

export function FriendUserSearch({ viewerId }: FriendUserSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data: profiles, error: profileError } = await supabase.rpc(
        "search_profiles",
        {
          p_query: debouncedQuery,
          p_limit: RESULT_LIMIT,
        },
      );

      const profileRows = (profiles ?? []) as SearchProfileRow[];

      if (cancelled) return;

      if (profileError) {
        setResults([]);
        setSearched(true);
        setLoading(false);
        setError("검색에 실패했습니다.");
        return;
      }

      if (!profileRows.length) {
        setResults([]);
        setSearched(true);
        setLoading(false);
        return;
      }

      const targetIds = profileRows.map((profile) => profile.id);
      const pairsFilter = buildFriendshipPairsFilter(viewerId, targetIds);
      const { data: friendshipRows } = pairsFilter
        ? await supabase
            .from("friendships")
            .select("requester_id, addressee_id, status")
            .or(pairsFilter)
        : { data: [] };

      if (cancelled) return;

      setResults(
        profileRows.map((profile) => {
          const nickname = profile.nickname?.trim() || null;
          const displayName = profile.display_name?.trim() || null;

          return {
            userId: profile.id,
            label: formatFriendProfileLabel(nickname, displayName),
            nickname,
            displayName,
            sport: profile.preferred_sports?.[0] ?? null,
            photoUrl: profile.photo_url,
            weightClass: profile.weight_class,
            friendshipState: resolveFriendshipStateFromRows(
              viewerId,
              profile.id,
              friendshipRows ?? [],
            ),
          };
        }),
      );
      setSearched(true);
      setLoading(false);
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, viewerId]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">운동 친구 찾기</h2>
      <p className="mt-1 text-xs text-zinc-500">
        닉네임이나 이름으로 검색해 운동 친구를 요청할 수 있습니다.
      </p>

      <div className="relative mt-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="닉네임 또는 이름 검색"
          aria-label="운동 친구 닉네임 또는 이름 검색"
          className="w-full rounded-lg border border-zinc-300 py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {loading && (
        <p className="mt-3 text-sm text-zinc-500">검색 중...</p>
      )}

      {!loading && debouncedQuery.length > 0 && debouncedQuery.length < MIN_QUERY_LENGTH && (
        <p className="mt-3 text-sm text-zinc-500">
          {MIN_QUERY_LENGTH}글자 이상 입력해주세요.
        </p>
      )}

      {!loading && searched && results.length === 0 && debouncedQuery.length >= MIN_QUERY_LENGTH && (
        <p className="mt-3 text-sm text-zinc-500">검색 결과가 없습니다.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-100">
          {results.map((result) => (
            <li
              key={result.userId}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <SearchResultAvatar
                photoUrl={result.photoUrl}
                label={result.label}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${result.userId}`}
                  className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                >
                  {result.label}
                </Link>
                <p className="text-xs text-zinc-500">
                  {formatFriendProfileSubtitle(
                    result.nickname,
                    result.displayName,
                    result.sport,
                    result.weightClass,
                  )}
                </p>
              </div>
              <div className="shrink-0">
                <FriendAddButton
                  viewerId={viewerId}
                  targetId={result.userId}
                  initialState={result.friendshipState}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SearchResultAvatar({
  photoUrl,
  label,
}: {
  photoUrl: string | null;
  label: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
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
