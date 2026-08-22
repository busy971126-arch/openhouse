import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_EVENT_FIELDS,
  ADMIN_FORBIDDEN_FIELDS,
  ADMIN_GYM_FIELDS,
  ADMIN_OVERVIEW_FIELDS,
  ADMIN_USER_FIELDS,
  rpcRowHasForbiddenFields,
} from "@/lib/admin/rpc-fields";
import {
  getAdminApplication,
  getAdminApplications,
  getAdminEventDetail,
  getAdminEvents,
  getAdminGyms,
  getAdminOverview,
  getAdminUsers,
} from "@/lib/queries/admin";

function rpcClient(name: string, data: unknown) {
  return {
    rpc: vi.fn(async (fn: string) => {
      expect(fn).toBe(name);
      return { data, error: null };
    }),
  } as never;
}

describe("admin directory queries use RPCs", () => {
  it("maps overview from admin_get_overview without extra fields", async () => {
    const row = {
      new_users_today: 2,
      applications_today: 3,
      events_published_today: 1,
      active_events_today: 4,
      pending_application_count: 5,
      open_inquiry_count: 0,
      open_report_count: 1,
      draft_event_count: 2,
      events_next_7_days: 6,
      active_application_count: 7,
      phone: "010",
    };
    expect(rpcRowHasForbiddenFields(row)).toBe(true);

    const overview = await getAdminOverview(
      rpcClient("admin_get_overview", [row]),
    );
    expect(overview).toEqual({
      newUsersToday: 2,
      applicationsToday: 3,
      eventsPublishedToday: 1,
      activeEventsToday: 4,
      pendingApplicationCount: 5,
      openInquiryCount: 0,
      openReportCount: 1,
      draftEventCount: 2,
      eventsNext7Days: 6,
      activeApplicationCount: 7,
    });
    expect(ADMIN_OVERVIEW_FIELDS).toHaveLength(10);
  });

  it("maps users/gyms/events from allowlisted RPC columns only", async () => {
    const users = await getAdminUsers(
      rpcClient("admin_get_users", [
        {
          id: "u1",
          nickname: "n",
          display_name: "d",
          created_at: "2026-01-01",
          is_operator: false,
          application_count: 2,
          phone: "010",
          parent_phone: "011",
        },
      ]),
    );
    expect(users).toEqual([
      {
        id: "u1",
        nickname: "n",
        displayName: "d",
        createdAt: "2026-01-01",
        isOperator: false,
        applicationCount: 2,
      },
    ]);

    const gyms = await getAdminGyms(
      rpcClient("admin_get_gyms", [
        {
          id: "g1",
          name: "Gym",
          sport: "bjj",
          region: "서울",
          is_public: true,
          created_at: "2026-01-01",
          owner_label: "호스트",
          upcoming_event_count: 1,
          operator_memo: "secret",
        },
      ]),
    );
    expect(gyms[0]).toEqual({
      id: "g1",
      name: "Gym",
      sport: "bjj",
      region: "서울",
      isPublic: true,
      createdAt: "2026-01-01",
      ownerLabel: "호스트",
      upcomingEventCount: 1,
    });
    expect("operator_memo" in gyms[0]).toBe(false);

    const events = await getAdminEvents(
      rpcClient("admin_get_events", [
        {
          id: "e1",
          title: "Open",
          event_date: "2026-02-01",
          status: "draft",
          gym_name: "Gym",
          host_label: "호스트",
          application_count: 3,
          is_hidden: true,
          is_paused: false,
          applicant_notes: "nope",
        },
      ]),
    );
    expect(events[0]).toEqual({
      id: "e1",
      title: "Open",
      eventDate: "2026-02-01",
      status: "draft",
      gymName: "Gym",
      hostLabel: "호스트",
      applicationCount: 3,
      isHidden: true,
      isPaused: false,
    });

    expect(ADMIN_USER_FIELDS.length + ADMIN_GYM_FIELDS.length + ADMIN_EVENT_FIELDS.length).toBeGreaterThan(0);
    expect(ADMIN_FORBIDDEN_FIELDS).toContain("phone");
  });

  it("maps event detail from allowlisted RPC columns only", async () => {
    const detail = await getAdminEventDetail(
      rpcClient("admin_get_event_detail", [
        {
          id: "e1",
          title: "Draft Open",
          sport: "bjj",
          event_type: "open_mat",
          event_date: "2026-09-01",
          event_time: "18:00:00",
          status: "draft",
          region: "서울",
          address: "도로명",
          gym_id: "g1",
          gym_name: "Private Gym",
          gym_is_public: false,
          host_label: "호스트",
          max_participants: 12,
          active_application_count: 0,
          created_at: "2026-08-01T00:00:00Z",
          description: "검수용 설명",
          is_publicly_viewable: false,
          admin_hidden_at: null,
          admin_recruitment_paused_at: null,
          admin_moderation_reason: null,
          emergency_contact: "010",
          applicant_notes: "nope",
          operator_memo: "secret",
        },
      ]),
      "e1",
    );

    expect(detail).toEqual({
      id: "e1",
      title: "Draft Open",
      sport: "bjj",
      eventType: "open_mat",
      eventDate: "2026-09-01",
      eventTime: "18:00:00",
      status: "draft",
      region: "서울",
      address: "도로명",
      gymId: "g1",
      gymName: "Private Gym",
      gymIsPublic: false,
      hostLabel: "호스트",
      maxParticipants: 12,
      activeApplicationCount: 0,
      createdAt: "2026-08-01T00:00:00Z",
      description: "검수용 설명",
      isPubliclyViewable: false,
      isHidden: false,
      isPaused: false,
      moderationReason: null,
    });
    expect(detail && "emergency_contact" in detail).toBe(false);
  });

  it("maps applications from allowlisted RPC columns only", async () => {
    const items = await getAdminApplications(
      rpcClient("admin_get_applications", [
        {
          id: "r1",
          created_at: "2026-08-22T00:00:00Z",
          status: "pending",
          participant_label: "nick",
          event_id: "e1",
          event_title: "Open",
          event_date: "2026-09-01",
          gym_name: "Gym",
          phone: "010",
          applicant_notes: "nope",
        },
      ]),
    );
    expect(items).toEqual([
      {
        id: "r1",
        createdAt: "2026-08-22T00:00:00Z",
        status: "pending",
        participantLabel: "nick",
        eventId: "e1",
        eventTitle: "Open",
        eventDate: "2026-09-01",
        gymName: "Gym",
      },
    ]);
    expect("phone" in items[0]).toBe(false);

    const detail = await getAdminApplication(
      rpcClient("admin_get_application_detail", [
        {
          id: "r1",
          created_at: "2026-08-22T00:00:00Z",
          status: "pending",
          participant_id: "u1",
          participant_label: "nick",
          event_id: "e1",
          event_title: "Open",
          event_date: "2026-09-01",
          gym_id: "g1",
          gym_name: "Gym",
          host_label: "호스트",
          parent_phone: "011",
        },
      ]),
      "r1",
    );
    expect(detail).toEqual({
      id: "r1",
      createdAt: "2026-08-22T00:00:00Z",
      status: "pending",
      participantLabel: "nick",
      participantId: "u1",
      eventId: "e1",
      eventTitle: "Open",
      eventDate: "2026-09-01",
      gymId: "g1",
      gymName: "Gym",
      hostLabel: "호스트",
    });
    expect(detail && "parent_phone" in detail).toBe(false);
  });
});
