import Link from "next/link";
import { GymForm } from "@/components/gym/GymForm";

export default function NewGymPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/my/profile"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 내 프로필
      </Link>

      <header className="mb-5 mt-4">
        <h1 className="text-2xl font-bold text-zinc-900">체육관 등록</h1>
        <p className="mt-1 text-sm text-zinc-500">
          필수 항목만 입력해도 등록할 수 있습니다
        </p>
      </header>

      <GymForm mode="create" />
    </div>
  );
}
