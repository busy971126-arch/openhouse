import { createClient } from "@/lib/supabase/server";
import { getMyPageData } from "@/lib/queries/my-page";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MainShell } from "@/components/MainShell";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hostNav = user ? await getMyPageData(user.id) : null;
  const isHost = hostNav?.isOperator ?? false;
  const pendingApprovals = hostNav?.pendingApprovals ?? 0;

  return (
    <>
      <Header isLoggedIn={!!user} />
      <MainShell>{children}</MainShell>
      <BottomNav
        isLoggedIn={!!user}
        isHost={isHost}
        pendingApprovals={pendingApprovals}
      />
    </>
  );
}
