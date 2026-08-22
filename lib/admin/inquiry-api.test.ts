import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminViewer } from "@/lib/admin/auth";
import { PATCH } from "@/app/api/admin/inquiries/[id]/route";
import { ADMIN_GENERIC_ERROR, ADMIN_REPLY_MAX_LENGTH } from "@/lib/admin/validation";

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

describe("PATCH /api/admin/inquiries/[id]", () => {
  beforeEach(() => {
    vi.mocked(getAdminViewer).mockReset();
  });

  it("returns 400 for an invalid status and does not update", async () => {
    const supabase = createAdminClient({
      current: { id: "inq-1", status: "open", admin_reply: null },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/inquiries/inq-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted" }),
      }),
      { params: Promise.resolve({ id: "inq-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "올바른 상태가 아닙니다." });
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it("returns 400 when the reply is too long", async () => {
    const supabase = createAdminClient({
      current: { id: "inq-1", status: "open", admin_reply: null },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/inquiries/inq-1", {
        method: "PATCH",
        body: JSON.stringify({
          adminReply: "가".repeat(ADMIN_REPLY_MAX_LENGTH + 1),
        }),
      }),
      { params: Promise.resolve({ id: "inq-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "답변이 너무 깁니다." });
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it("hides database error messages from the client", async () => {
    const supabase = createAdminClient({
      current: { id: "inq-1", status: "open", admin_reply: null },
      updateError: { message: "column inquiries.secret does not exist" },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/inquiries/inq-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "answered", adminReply: "확인" }),
      }),
      { params: Promise.resolve({ id: "inq-1" }) },
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe(ADMIN_GENERIC_ERROR);
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(supabase.update).toHaveBeenCalledTimes(1);
  });

  it("updates once when an admin saves a reply (trigger writes one action log)", async () => {
    const supabase = createAdminClient({
      current: { id: "inq-1", status: "open", admin_reply: null },
    });
    vi.mocked(getAdminViewer).mockResolvedValue({
      user: adminUser,
      isAdmin: true,
      supabase,
    } as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/inquiries/inq-1", {
        method: "PATCH",
        body: JSON.stringify({ adminReply: "확인했습니다." }),
      }),
      { params: Promise.resolve({ id: "inq-1" }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.update).toHaveBeenCalledTimes(1);
    expect(supabase.update).toHaveBeenCalledWith({
      status: "answered",
      admin_reply: "확인했습니다.",
    });
  });
});
