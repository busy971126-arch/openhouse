import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_APPLICATION_DETAIL_FIELDS,
  ADMIN_APPLICATION_FIELDS,
  ADMIN_FORBIDDEN_FIELDS,
} from "@/lib/admin/rpc-fields";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260822140000_admin_control_center_phase1.sql",
  ),
  "utf8",
);

describe("admin control center phase 1 SQL", () => {
  it("does not restore broad admin SELECT or add hard delete", () => {
    expect(migration).not.toContain("Admins can view all profiles");
    expect(migration).not.toContain("Admins can view all registrations");
    expect(migration).not.toMatch(/delete from public\.(events|users|gyms|registrations)/i);
    expect(migration).not.toContain("'event.cancel'");
    expect(migration).not.toContain("force approve");
  });

  it("requires is_admin() on new RPCs and keep search_path empty", () => {
    for (const name of [
      "admin_get_applications",
      "admin_get_application_detail",
      "admin_get_activity",
      "admin_moderate_event",
    ]) {
      expect(migration).toContain(`function public.${name}`);
    }
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("Asia/Seoul");
  });

  it("keeps application RPC fields free of private contacts", () => {
    const applicationsSql = migration.slice(
      migration.indexOf("create or replace function public.admin_get_applications"),
      migration.indexOf("create or replace function public.admin_get_activity"),
    );
    expect(applicationsSql.length).toBeGreaterThan(100);

    for (const field of ADMIN_APPLICATION_FIELDS) {
      expect(applicationsSql).toContain(field);
    }
    for (const field of ADMIN_APPLICATION_DETAIL_FIELDS) {
      expect(applicationsSql).toContain(field);
    }
    for (const field of ADMIN_FORBIDDEN_FIELDS) {
      expect(applicationsSql).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
