import { describe, expect, it } from "vitest";
import {
  ADMIN_EVENT_DETAIL_FIELDS,
  ADMIN_EVENT_FIELDS,
  ADMIN_FORBIDDEN_FIELDS,
  ADMIN_GYM_FIELDS,
  ADMIN_OVERVIEW_FIELDS,
  ADMIN_USER_FIELDS,
  pickRpcFields,
  rpcRowHasForbiddenFields,
} from "@/lib/admin/rpc-fields";

describe("admin RPC field allowlists", () => {
  it("returns only the declared overview columns", () => {
    const picked = pickRpcFields(
      {
        user_count: 1,
        gym_count: 2,
        phone: "010",
        pending_gym_info: { name: "x" },
      },
      ADMIN_OVERVIEW_FIELDS,
    );
    expect(Object.keys(picked).sort()).toEqual([...ADMIN_OVERVIEW_FIELDS].sort());
    expect("phone" in picked).toBe(false);
  });

  it("returns only the declared user/gym/event columns", () => {
    expect(ADMIN_USER_FIELDS).toEqual([
      "id",
      "nickname",
      "display_name",
      "created_at",
      "is_operator",
      "application_count",
    ]);
    expect(ADMIN_GYM_FIELDS).toEqual([
      "id",
      "name",
      "sport",
      "region",
      "is_public",
      "created_at",
      "owner_label",
      "upcoming_event_count",
    ]);
    expect(ADMIN_EVENT_FIELDS).toEqual([
      "id",
      "title",
      "event_date",
      "status",
      "gym_name",
      "host_label",
      "application_count",
    ]);
    expect(ADMIN_EVENT_DETAIL_FIELDS).toEqual([
      "id",
      "title",
      "sport",
      "event_type",
      "event_date",
      "event_time",
      "status",
      "region",
      "address",
      "gym_id",
      "gym_name",
      "gym_is_public",
      "host_label",
      "max_participants",
      "active_application_count",
      "created_at",
      "description",
      "is_publicly_viewable",
    ]);
  });

  it("flags sensitive columns that admin RPCs must never return", () => {
    expect(
      rpcRowHasForbiddenFields({
        id: "1",
        phone: "010",
      }),
    ).toBe(true);
    expect(rpcRowHasForbiddenFields({ id: "1", nickname: "n" })).toBe(false);
    expect(ADMIN_FORBIDDEN_FIELDS).toEqual([
      "phone",
      "parent_phone",
      "pending_gym_info",
      "emergency_contact",
      "applicant_notes",
      "operator_memo",
    ]);
  });
});
