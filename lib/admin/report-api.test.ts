import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminViewer } from "@/lib/admin/auth";
import { PATCH } from "@/app/api/admin/reports/[id]/route";
import { ADMIN_GENERIC_ERROR } from "@/lib/admin/validation";

vi.mock("@/lib/admin/auth", () => ({
  getAdminViewer: vi.fn(),
}));

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

function createAdminClient(options: {
  current?: Record<string, unknown> | null;
  loadError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const maybeSingle = vi.fn(async (): Promise<QueryResult> => ({
    data: options.current ?? null,
    error: options.loadError ?? null,
  }));
  const updateEq = vi.fn(async (): Promise<QueryResult> => ({
    data: null,
    error: options.updateError ?? null,
  }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const select = vi.fn(() => ({
    eq: () => ({ maybeSingle }),
  }));
  const from = vi.fn(() => ({ select, update }));

  return { from, select, update, updateEq, maybeSingle };
}

const adminUser = { id: "admin-1" };

describe("PATCH /api/admin/reports/[id]", () => {
  beforeEach(() => {
    vi.mocked(getAdminViewer).mockReset();
  });

  it("returns 400 for an invalid status and does not update", async () => {
    const supabase = createAdminClient({
      current: { id: "rep-1", status: "received" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/reports/rep-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "banned" }),
      }),
      { params: Promise.resolve({ id: "rep-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "올바른 상태가 아닙니다." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("clears resolved_at when moving resolved → reviewing", async () => {
    const supabase = createAdminClient({
      current: { id: "rep-1", status: "resolved" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/reports/rep-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "reviewing" }),
      }),
      { params: Promise.resolve({ id: "rep-1" }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledTimes(1);
    expect(supabase.update).toHaveBeenCalledWith({
      status: "reviewing",
      resolved_at: null,
    });
  });

  it("hides database error messages from the client", async () => {
    const supabase = createAdminClient({
      current: { id: "rep-1", status: "received" },
      updateError: { message: "duplicate key value violates unique constraint" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/reports/rep-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "reviewing" }),
      }),
      { params: Promise.resolve({ id: "rep-1" }) },
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe(ADMIN_GENERIC_ERROR);
    expect(JSON.stringify(body)).not.toContain("duplicate key");
  });

  it("updates once when an admin changes status (trigger writes one action log)", async () => {
    const supabase = createAdminClient({
      current: { id: "rep-1", status: "received" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/reports/rep-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "rep-1" }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledTimes(1);
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        resolved_at: expect.any(String),
      }),
    );
  });
});
