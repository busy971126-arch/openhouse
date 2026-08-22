import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260822150000_admin_control_center_security_followup.sql",
  ),
  "utf8",
);

describe("admin control center security follow-up SQL", () => {
  it("removes public admin actor and reason columns", () => {
    expect(migration).toContain("drop column if exists admin_hidden_by");
    expect(migration).toContain("drop column if exists admin_recruitment_paused_by");
    expect(migration).toContain("drop column if exists admin_moderation_reason");
    expect(migration).toContain("last_moderation_reason");
    expect(migration).toContain("from public.admin_action_logs");
  });

  it("revokes party registration from authenticated and keeps solo untouched", () => {
    expect(migration).toContain(
      "revoke all on function public.create_party_registration",
    );
    expect(migration).toContain("from authenticated");
    expect(migration).not.toContain("revoke all on function public.create_solo_registration");
  });

  it("keeps admin RPCs locked down", () => {
    expect(migration).toContain("if not public.is_admin() then");
    expect(migration).toContain("set search_path = ''");
    expect(migration).not.toContain("Admins can view all events");
    expect(migration).not.toContain("Admins can view all profiles");
  });
});
