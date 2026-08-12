/** 하단 탭을 보여줄 메인 화면 경로 */
export function shouldShowBottomNav(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/events") return true;
  if (pathname === "/my") return true;
  if (pathname === "/host/gyms") return true;
  return false;
}

export type BottomNavTab = "home" | "events" | "gyms" | "my";

export function getActiveBottomNavTab(pathname: string): BottomNavTab | null {
  if (pathname === "/") return "home";
  if (pathname === "/events") return "events";
  if (pathname === "/host/gyms") return "gyms";
  if (pathname === "/my") return "my";
  return null;
}
