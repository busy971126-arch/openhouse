"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdminPath } from "@/lib/utils/admin";

type HeaderProps = {
  isLoggedIn: boolean;
};

const AUTH_BRAND_PATHS = ["/login", "/signup"];

export function Header({ isLoggedIn }: HeaderProps) {
  const pathname = usePathname();

  if (
    AUTH_BRAND_PATHS.some((path) => pathname.startsWith(path)) ||
    isAdminPath(pathname)
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-lg items-center justify-between px-4 py-2">
        <Link href="/" className="group flex items-center gap-2" aria-label="OpenHouse 홈">
          <span className="h-4 w-1 bg-orange-600 transition group-hover:h-5" />
          <span className="text-[13px] font-black tracking-[0.14em] text-zinc-950">
            OPENHOUSE
          </span>
        </Link>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="text-xs font-semibold tracking-wide text-zinc-700 hover:text-orange-600"
          >
            LOGIN
          </Link>
        )}
      </div>
    </header>
  );
}
