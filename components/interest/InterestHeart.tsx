"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  toggleEventInterest,
  toggleGymInterest,
} from "@/lib/api/interests";
import { getInterestToastMessage } from "@/lib/utils/interest-display";
import { HeartToggle } from "@/components/interest/HeartToggle";
import { InterestToast } from "@/components/interest/InterestToast";

type InterestHeartProps = {
  kind: "gym" | "event";
  targetId: string;
  initialInterested: boolean;
  userId: string | null;
  loginRedirect: string;
  className?: string;
  size?: "xs" | "sm" | "md";
  variant?: "default" | "overlay";
};

export function InterestHeart({
  kind,
  targetId,
  initialInterested,
  userId,
  loginRedirect,
  className = "",
  size = "md",
  variant = "default",
}: InterestHeartProps) {
  const router = useRouter();
  const [interested, setInterested] = useState(initialInterested);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  async function handleToggle() {
    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    const previous = interested;
    const nextInterested = !interested;
    setInterested(nextInterested);
    setToast(getInterestToastMessage(kind, nextInterested));
    setLoading(true);

    try {
      const result =
        kind === "gym"
          ? await toggleGymInterest(targetId)
          : await toggleEventInterest(targetId);

      setInterested(result.interested);
      setToast(getInterestToastMessage(kind, result.interested));
      router.refresh();
    } catch {
      setInterested(previous);
      setToast(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <HeartToggle
        isInterested={interested}
        onToggle={handleToggle}
        disabled={loading}
        className={className}
        size={size}
        variant={variant}
        ariaLabel={kind === "gym" ? "관심 체육관" : "관심 이벤트"}
      />
      <InterestToast message={toast} onDismiss={dismissToast} />
    </>
  );
}
