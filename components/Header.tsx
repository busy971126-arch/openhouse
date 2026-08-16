"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderProps = {
  isLoggedIn: boolean;
};

const AUTH_BRAND_PATHS = ["/login", "/signup"];

export function Header({ isLoggedIn }: HeaderProps) {
  const pathname = usePathname();

  if (AUTH_BRAND_PATHS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-lg items-center justify-between px-4 py-2">
        <Link
          href="/"
          className="text-lg font-bold leading-none text-orange-600"
        >
          OpenHouse
        </Link>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="rounded-full bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-700"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
