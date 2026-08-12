import { redirect } from "next/navigation";
import { UserProfileContent } from "@/components/profile/UserProfileContent";
import { createClient } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/profile");

  return (
    <UserProfileContent
      userId={user.id}
      backHref="/my"
      backLabel="← 마이페이지"
      isOwner
    />
  );
}
