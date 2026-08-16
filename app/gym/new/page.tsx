import Link from "next/link";
import { redirect } from "next/navigation";
import { GymForm } from "@/components/gym/GymForm";
import { getPendingGymRegistration } from "@/lib/queries/pending-gym";
import { createClient } from "@/lib/supabase/server";
import { getPendingGymFormDefaults } from "@/lib/utils/pending-gym-info";

export default async function NewGymPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/gym/new");

  const pending = await getPendingGymRegistration(user.id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const pendingDefaults = pending
    ? getPendingGymFormDefaults(pending, profile ?? undefined)
    : null;

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

      <GymForm mode="create" pendingDefaults={pendingDefaults} />
    </div>
  );
}
