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
      className="group flex w-full items-center justify-between border-b border-zinc-200 py-4 text-left"
    >
      <span className="font-semibold text-zinc-950 transition group-hover:text-orange-700">
        {label}
      </span>
      <span className="text-sm text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700">
        →
      </span>
    </button>
  );
}
