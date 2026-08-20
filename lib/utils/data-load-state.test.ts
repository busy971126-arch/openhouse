import { describe, expect, it } from "vitest";
import { loadStateFromQuery } from "@/lib/utils/data-load-state";

describe("loadStateFromQuery", () => {
  it("returns success with rows", () => {
    expect(loadStateFromQuery(null, [{ id: "1" }])).toEqual({
      status: "success",
      data: [{ id: "1" }],
    });
  });

  it("returns success with empty data", () => {
    expect(loadStateFromQuery(undefined, [])).toEqual({
      status: "success",
      data: [],
    });
  });

  it("returns error and does not treat failure as empty", () => {
    expect(loadStateFromQuery({ message: "boom" }, [])).toEqual({
      status: "error",
    });
  });
});
