import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminViewer } from "@/lib/admin/auth";
import { PATCH } from "@/app/api/admin/events/[id]/route";
import { ADMIN_GENERIC_ERROR, ADMIN_REASON_MAX_LENGTH } from "@/lib/admin/validation";

vi.mock("@/lib/admin/auth", () => ({
  getAdminViewer: vi.fn(),
}));

const adminUser = { id: "admin-1" };

describe("PATCH /api/admin/events/[id]", () => {
  beforeEach(() => {
    vi.mocked(getAdminViewer).mockReset();
  });

  it("returns 403 when the viewer is not an admin", async () => {
    const rpc = vi.fn();
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: false,
      supabase: { rpc },
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/events/e1", {
        method: "PATCH",
        body: JSON.stringify({ action: "event.hide", reason: "스팸" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid action", async () => {
    const rpc = vi.fn();
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase: { rpc },
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/events/e1", {
        method: "PATCH",
        body: JSON.stringify({ action: "event.delete", reason: "삭제" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 400 when the reason is too long", async () => {
    const rpc = vi.fn();
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase: { rpc },
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/events/e1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "event.hide",
          reason: "가".repeat(ADMIN_REASON_MAX_LENGTH + 1),
        }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls the moderation RPC once for a valid hide", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase: { rpc },
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/events/e1", {
        method: "PATCH",
        body: JSON.stringify({ action: "event.hide", reason: "스팸" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("admin_moderate_event", {
      p_event_id: "e1",
      p_action: "event.hide",
      p_reason: "스팸",
    });
  });

  it("hides unexpected database errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      error: { message: "column events.secret does not exist" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase: { rpc },
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/events/e1", {
        method: "PATCH",
        body: JSON.stringify({ action: "event.hide", reason: "스팸" }),
      }),
      { params: Promise.resolve({ id: "e1" }) },
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe(ADMIN_GENERIC_ERROR);
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});
