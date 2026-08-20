import { describe, expect, it } from "vitest";
import {
  buildApprovedCountsResult,
  getApprovedCountFromResult,
} from "@/lib/utils/event-counts-map";

describe("buildApprovedCountsResult", () => {
  it("keeps actual counts including zero", () => {
    const result = buildApprovedCountsResult(
      ["a", "b"],
      [{ event_id: "a", approved_count: 3 }],
      null,
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.counts.get("a")).toBe(3);
    expect(result.counts.get("b")).toBe(0);
  });

  it("does not convert RPC failure into zero counts", () => {
    const result = buildApprovedCountsResult(
      ["a", "b"],
      [{ event_id: "a", approved_count: 3 }],
      { message: "rpc failed" },
    );

    expect(result).toEqual({ status: "error" });
    expect(getApprovedCountFromResult(result, "a")).toBeNull();
  });
});
