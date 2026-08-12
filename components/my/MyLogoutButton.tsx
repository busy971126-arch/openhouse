"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MyLogoutButtonProps = {
  label?: string;
};

export function MyLogoutButton({ label = "로그아웃" }: MyLogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:bg-zinc-50"
    >
      <span className="font-medium text-zinc-900">{label}</span>
      <span className="text-zinc-400">→</span>
    </button>
  );
}
