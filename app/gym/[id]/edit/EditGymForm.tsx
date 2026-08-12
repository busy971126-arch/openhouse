"use client";

import Link from "next/link";
import { GymForm } from "@/components/gym/GymForm";

type EditGymPageProps = {
  gymId: string;
};

export default function EditGymForm({ gymId }: EditGymPageProps) {
  return (
    <div className="mx-auto max-w-md">
      <Link
        href={`/host/gyms/${gymId}`}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 체육관 관리
      </Link>

      <header className="mb-5 mt-4">
        <h1 className="text-2xl font-bold text-zinc-900">체육관 정보 수정</h1>
        <p className="mt-1 text-sm text-zinc-500">
          참가자에게 보이는 체육관 정보를 관리합니다
        </p>
      </header>

      <GymForm mode="edit" gymId={gymId} />
    </div>
  );
}
