import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260822120000_admin_security_review.sql",
  ),
  "utf8",
);

describe("admin security review SQL", () => {
  it("drops broad admin SELECT policies", () => {
    expect(migration).toContain(
      'drop policy if exists "Admins can view all profiles" on public.profiles',
    );
    expect(migration).toContain(
      'drop policy if exists "Admins can view all registrations" on public.registrations',
    );
    expect(migration).toContain(
      'drop policy if exists "Admins can view all gyms" on public.gyms',
    );
    expect(migration).toContain(
      'drop policy if exists "Admins can view all events" on public.events',
    );
  });

  it("keeps audit logs when admin_users rows are removed", () => {
    expect(migration).toContain("alter column admin_user_id drop not null");
    expect(migration).toContain("references auth.users (id)");
    expect(migration).toContain("on delete set null");
    expect(migration).not.toMatch(
      /admin_action_logs[\s\S]{0,400}on delete cascade/,
    );
  });

  it("does not block service-role maintenance updates", () => {
    expect(migration).toContain("if auth.uid() is not null then");
    expect(migration).toContain("if auth.uid() is null then");
    expect(migration).toContain("return new;");
  });

  it("requires is_admin() inside each directory RPC", () => {
    for (const name of [
      "admin_get_overview",
      "admin_get_users",
      "admin_get_gyms",
      "admin_get_events",
    ]) {
      expect(migration).toContain(`function public.${name}`);
    }
    expect(migration.match(/if not public\.is_admin\(\) then/g)?.length).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("does not select forbidden profile/registration columns in RPCs", () => {
    expect(migration).not.toMatch(/p\.phone|r\.phone|parent_phone/);
    expect(migration).not.toContain("pending_gym_info");
    expect(migration).not.toContain("emergency_contact");
    expect(migration).not.toContain("applicant_notes");
    expect(migration).not.toContain("operator_memo");
  });
});
