import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getAdminViewer();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
          ADMIN
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-zinc-950">
          접근 권한이 없습니다.
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          이 페이지는 OpenHouse 운영자만 사용할 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-zinc-950 underline underline-offset-4"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
