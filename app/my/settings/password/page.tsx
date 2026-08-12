import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/settings/password");

  return (
    <div className="mx-auto max-w-md flex flex-col gap-6">
      <Link href="/my/settings" className="text-sm font-medium text-orange-600">
        ← 설정
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">비밀번호 변경</h1>
      <ChangePasswordForm />
    </div>
  );
}
