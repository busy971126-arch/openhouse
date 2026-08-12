"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FriendshipState } from "@/lib/queries/friends";

type FriendAddButtonProps = {
  viewerId: string;
  targetId: string;
  initialState: FriendshipState;
};

export function FriendAddButton({
  viewerId,
  targetId,
  initialState,
}: FriendAddButtonProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === "self") return null;

  async function refreshFriendship() {
    router.refresh();
  }

  async function sendRequest() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("friendships").insert({
      requester_id: viewerId,
      addressee_id: targetId,
      status: "pending",
    });

    if (insertError?.code === "23505") {
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("requester_id", viewerId)
        .eq("addressee_id", targetId);

      if (updateError) {
        setError("친구 요청에 실패했습니다.");
        setLoading(false);
        return;
      }
    } else if (insertError) {
      setError("친구 요청에 실패했습니다.");
      setLoading(false);
      return;
    }

    setState("pending_sent");
    setLoading(false);
    await refreshFriendship();
  }

  async function acceptRequest() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("requester_id", targetId)
      .eq("addressee_id", viewerId)
      .eq("status", "pending");

    if (updateError) {
      setError("수락에 실패했습니다.");
      setLoading(false);
      return;
    }

    setState("friends");
    setLoading(false);
    await refreshFriendship();
  }

  async function cancelRequest() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("friendships")
      .delete()
      .eq("requester_id", viewerId)
      .eq("addressee_id", targetId)
      .eq("status", "pending");

    if (deleteError) {
      setError("요청 취소에 실패했습니다.");
      setLoading(false);
      return;
    }

    setState("none");
    setLoading(false);
    await refreshFriendship();
  }

  if (state === "friends") {
    return (
      <span className="inline-flex items-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600">
        친구
      </span>
    );
  }

  if (state === "pending_sent") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={cancelRequest}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          요청 보냄 · 취소
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === "pending_received") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={acceptRequest}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          친구 요청 수락
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={sendRequest}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        친구 추가
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
