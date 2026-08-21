"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MinimalEventForm } from "@/components/events/MinimalEventForm";
import type { Gym } from "@/lib/types/database";
import { PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";

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

      setGyms(data ?? []);
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
    <div className="mx-auto max-w-md">
      <Link href={backHref} className="text-sm text-orange-600 hover:underline">
        ← 이벤트 관리
      </Link>
      <header className="mb-5 mt-4">
        <h1 className="text-2xl font-bold text-zinc-900">이벤트 만들기</h1>
        <p className="mt-1 text-sm text-zinc-500">
          기본 일정만 먼저 만들고 상세 정보는 나중에 채울 수 있어요.
        </p>
      </header>
      <MinimalEventForm gyms={gyms} defaultGymId={defaultGymId} />
    </div>
  );
}
