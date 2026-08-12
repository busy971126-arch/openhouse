"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";

type GymFollowButtonProps = {
  gymId: string;
  gymName: string;
  userId: string | null;
  initialFollowed: boolean;
  loginRedirect: string;
};

export function GymFollowButton({
  gymId,
  gymName,
  userId,
  initialFollowed,
  loginRedirect,
}: GymFollowButtonProps) {
  const router = useRouter();
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <a
        href={`/login?redirect=${encodeURIComponent(loginRedirect)}`}
        className="mt-3 block w-full rounded-lg border border-orange-300 py-2.5 text-center text-sm font-medium text-orange-700 hover:bg-orange-50"
      >
        로그인 후 관심 등록
      </a>
    );
  }

  async function toggleFollow() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (followed) {
      const { error: deleteError } = await supabase
        .from("gym_follows")
        .delete()
        .eq("user_id", userId)
        .eq("gym_id", gymId);

      setLoading(false);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setFollowed(false);
    } else {
      const { error: insertError } = await supabase.from("gym_follows").insert({
        user_id: userId,
        gym_id: gymId,
      });

      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setFollowed(true);
    }

    router.refresh();
  }

  return (
    <div className="mt-3">
      {error && <Alert message={error} />}
      <button
        type="button"
        disabled={loading}
        onClick={toggleFollow}
        className={`w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 ${
          followed
            ? "border border-zinc-300 bg-zinc-50 text-zinc-700"
            : "border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
        }`}
      >
        {loading
          ? "처리 중..."
          : followed
            ? `${gymName} 관심 등록됨`
            : `${gymName} 관심 등록`}
      </button>
    </div>
  );
}
