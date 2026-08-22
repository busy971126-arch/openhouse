"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/utils/admin";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  return (
    <div className="min-h-full bg-[#f7f7f3] text-zinc-950">
      <header className="border-b border-zinc-300">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-orange-600">
              ADMIN
            </p>
            <p className="mt-1 text-sm font-semibold tracking-[0.08em] text-zinc-950">
              OPENHOUSE OPERATIONS
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold tracking-wide text-zinc-500 hover:text-zinc-950"
          >
            사이트
          </Link>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-5 overflow-x-auto px-4 pb-3">
          {ADMIN_NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] ${
                  active
                    ? "border-b-2 border-zinc-950 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {item.label.toUpperCase()}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}
