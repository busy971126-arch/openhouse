"use client";

import { usePathname } from "next/navigation";
import { shouldShowBottomNav } from "@/lib/utils/bottom-nav";

type MainShellProps = {
  children: React.ReactNode;
};

export function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const hasBottomNav = shouldShowBottomNav(pathname);

  return (
    <main
      className={`mx-auto w-full max-w-lg flex-1 px-4 py-6 ${
        hasBottomNav ? "pb-24" : ""
      }`}
    >
      {children}
    </main>
  );
}
