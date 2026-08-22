import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_EVENT_DETAIL_FIELDS } from "@/lib/admin/rpc-fields";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260822130000_admin_event_detail.sql",
  ),
  "utf8",
);

describe("admin event detail SQL", () => {
  it("requires is_admin() and does not restore broad events SELECT", () => {
    expect(migration).toContain("function public.admin_get_event_detail");
    expect(migration).toContain("if not public.is_admin() then");
    expect(migration).toContain("set search_path = ''");
    expect(migration).not.toContain("Admins can view all events");
    expect(migration).not.toMatch(/create policy/i);
  });

  it("returns only inspection fields and omits sensitive columns", () => {
    for (const field of ADMIN_EVENT_DETAIL_FIELDS) {
      expect(migration).toContain(field);
    }
    expect(migration).not.toMatch(/\be\.emergency_contact\b/);
    expect(migration).not.toMatch(/\bapplicant_notes\b/);
    expect(migration).not.toMatch(/\boperator_memo\b/);
    expect(migration).not.toContain("representative_phone");
    expect(migration).toMatch(
      /returns table \([\s\S]*?is_publicly_viewable boolean\n\)/,
    );
    expect(
      migration.match(/returns table \([\s\S]*?is_publicly_viewable boolean\n\)/)?.[0],
    ).not.toContain("created_by");
  });
});
