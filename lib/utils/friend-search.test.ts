import { describe, expect, it } from "vitest";
import {
  buildFriendshipPairsFilter,
  escapeIlikePattern,
  filterFriendsByQuery,
  formatFriendProfileLabel,
  formatFriendProfileSubtitle,
  resolveFriendshipStateFromRows,
} from "@/lib/utils/friend-search";

describe("escapeIlikePattern", () => {
  it("escapes ilike wildcards", () => {
    expect(escapeIlikePattern("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});

describe("filterFriendsByQuery", () => {
  const friends = [
    {
      friendshipId: "1",
      userId: "u1",
      nickname: "타이거",
      displayName: "김철수",
      sport: "복싱",
      photoUrl: null,
      weightClass: "라이트",
    },
    {
      friendshipId: "2",
      userId: "u2",
      nickname: "베어",
      displayName: null,
      sport: "주짓수",
      photoUrl: null,
      weightClass: null,
    },
  ];

  it("returns all friends when query is empty", () => {
    expect(filterFriendsByQuery(friends, "")).toEqual(friends);
  });

  it("filters by nickname, name, sport, and weight class", () => {
    expect(filterFriendsByQuery(friends, "복싱")).toHaveLength(1);
    expect(filterFriendsByQuery(friends, "라이트")[0]?.nickname).toBe("타이거");
    expect(filterFriendsByQuery(friends, "김철수")).toHaveLength(1);
    expect(filterFriendsByQuery(friends, "없는이름")).toHaveLength(0);
  });
});

describe("formatFriendProfileLabel", () => {
  it("prefers nickname over display name", () => {
    expect(formatFriendProfileLabel("타이거", "김철수")).toBe("타이거");
    expect(formatFriendProfileLabel(null, "김철수")).toBe("김철수");
  });
});

describe("formatFriendProfileSubtitle", () => {
  it("shows real name when nickname is present", () => {
    expect(
      formatFriendProfileSubtitle("타이거", "김철수", "복싱", "라이트"),
    ).toBe("김철수 · 복싱 · 라이트");
  });
});

describe("resolveFriendshipStateFromRows", () => {
  it("returns self for same user", () => {
    expect(resolveFriendshipStateFromRows("a", "a", [])).toBe("self");
  });

  it("maps friendship rows to states", () => {
    const rows = [
      {
        requester_id: "viewer",
        addressee_id: "target",
        status: "pending",
      },
    ];

    expect(resolveFriendshipStateFromRows("viewer", "target", rows)).toBe(
      "pending_sent",
    );
    expect(resolveFriendshipStateFromRows("target", "viewer", rows)).toBe(
      "pending_received",
    );
  });
});

describe("buildFriendshipPairsFilter", () => {
  it("returns null for empty target ids", () => {
    expect(buildFriendshipPairsFilter("viewer", [])).toBeNull();
  });

  it("builds pair filters for targets", () => {
    expect(buildFriendshipPairsFilter("viewer", ["a", "b"])).toContain(
      "requester_id.eq.viewer",
    );
  });
});
