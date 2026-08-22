import { describe, expect, it } from "vitest";
import { shouldShowBottomNav, getActiveBottomNavTab } from "@/lib/utils/bottom-nav";

describe("bottom-nav", () => {
  describe("shouldShowBottomNav", () => {
    it("shows on main tab routes", () => {
      expect(shouldShowBottomNav("/")).toBe(true);
      expect(shouldShowBottomNav("/events")).toBe(true);
      expect(shouldShowBottomNav("/my")).toBe(true);
      expect(shouldShowBottomNav("/host/gyms")).toBe(true);
    });

    it("hides on sub-pages and auth flows", () => {
      expect(shouldShowBottomNav("/events/abc")).toBe(false);
      expect(shouldShowBottomNav("/events/new")).toBe(false);
      expect(shouldShowBottomNav("/my/profile")).toBe(false);
      expect(shouldShowBottomNav("/my/notifications")).toBe(false);
      expect(shouldShowBottomNav("/host/participants")).toBe(false);
      expect(shouldShowBottomNav("/host/gyms/abc")).toBe(false);
      expect(shouldShowBottomNav("/login")).toBe(false);
      expect(shouldShowBottomNav("/signup")).toBe(false);
      expect(shouldShowBottomNav("/admin")).toBe(false);
      expect(shouldShowBottomNav("/admin/inquiries")).toBe(false);
    });
  });

  describe("getActiveBottomNavTab", () => {
    it("returns active tab for main routes", () => {
      expect(getActiveBottomNavTab("/")).toBe("home");
      expect(getActiveBottomNavTab("/events")).toBe("events");
      expect(getActiveBottomNavTab("/host/gyms")).toBe("gyms");
      expect(getActiveBottomNavTab("/my")).toBe("my");
    });

    it("returns null for non-tab routes", () => {
      expect(getActiveBottomNavTab("/events/123")).toBeNull();
      expect(getActiveBottomNavTab("/my/profile")).toBeNull();
      expect(getActiveBottomNavTab("/host/participants")).toBeNull();
    });
  });
});
