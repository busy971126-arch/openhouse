"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventForm } from "@/components/events/EventForm";
import type { Gym } from "@/lib/types/database";
import { PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";
import { applyPrivateContactToGym } from "@/lib/queries/gym-private-contacts";

export function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultGymId = searchParams.get("gym") ?? undefined;
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGyms() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/events/new");
        return;
      }

      const { data } = await supabase
        .from("gyms")
        .select(PUBLIC_GYM_SELECT)
        .eq("owner_id", user.id);

      setGyms((data ?? []).map((gym) => applyPrivateContactToGym(gym, null)));
      setLoading(false);
    }

    loadGyms();
  }, [router]);

  if (loading) {
    return <p className="text-sm text-zinc-600">불러오는 중...</p>;
  }

  if (gyms.length === 0) {
    return (
      <div className="text-center">
        <p className="text-zinc-600">
          이벤트를 등록하려면 먼저 체육관을 등록해야 합니다.
        </p>
        <Link
          href="/gym/new"
          className="mt-4 inline-block rounded-lg bg-orange-600 px-6 py-3 font-medium text-white hover:bg-orange-700"
        >
          체육관 등록하기
        </Link>
      </div>
    );
  }

  const backHref = defaultGymId
    ? `/host/gyms/${defaultGymId}/events`
    : "/host/gyms";

  return (
    <div className="mx-auto max-w-sm">
      <Link href={backHref} className="text-sm text-orange-600 hover:underline">
        ← 이벤트 관리
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold">이벤트 등록</h1>
      <EventForm
        gyms={gyms}
        mode="create"
        defaultGymId={defaultGymId}
        redirectTo={
          defaultGymId ? `/host/gyms/${defaultGymId}/events` : "/host/gyms"
        }
      />
    </div>
  );
}
