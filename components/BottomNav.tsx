"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
import {
  getActiveBottomNavTab,
  shouldShowBottomNav,
} from "@/lib/utils/bottom-nav";

type BottomNavProps = {
  isLoggedIn: boolean;
  isHost: boolean;
  pendingApprovals: number;
};

type NavTab = {
  id: "home" | "events" | "my" | "gyms";
  href: string;
  label: string;
  icon: AppIconName;
  requiresAuth?: boolean;
};

const BASE_TABS: NavTab[] = [
  { id: "home", href: "/", label: "홈", icon: "home" },
  { id: "events", href: "/events", label: "이벤트", icon: "calendar" },
  { id: "my", href: "/my", label: "마이", icon: "user", requiresAuth: true },
];

const HOST_TAB: NavTab = {
  id: "gyms",
  href: "/host/gyms",
  label: "내 체육관",
  icon: "building",
  requiresAuth: true,
};

export function BottomNav({
  isLoggedIn,
  isHost,
  pendingApprovals,
}: BottomNavProps) {
  const pathname = usePathname();

  if (!shouldShowBottomNav(pathname)) {
    return null;
  }

  const activeTab = getActiveBottomNavTab(pathname);
  const tabs = isHost
    ? [BASE_TABS[0], BASE_TABS[1], HOST_TAB, BASE_TABS[2]]
    : BASE_TABS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur"
      aria-label="주요 메뉴"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const href =
            tab.requiresAuth && !isLoggedIn
              ? `/login?redirect=${encodeURIComponent(tab.href)}`
              : tab.href;
          const showBadge = tab.id === "gyms" && pendingApprovals > 0;

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition ${
                isActive
                  ? "font-semibold text-zinc-950"
                  : "font-medium text-zinc-500 hover:text-zinc-800"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <AppIcon
                  name={tab.icon}
                  className={`size-[21px] ${isActive ? "text-orange-600" : "text-zinc-500"}`}
                />
                {showBadge && (
                  <span className="absolute -right-2.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
                    {pendingApprovals > 9 ? "9+" : pendingApprovals}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
