import { describe, expect, it } from "vitest";
import {
  parseGymFacilities,
  serializeGymFacilities,
} from "./gym-facilities";

describe("gym-facilities", () => {
  it("serializes parking type", () => {
    expect(
      serializeGymFacilities({
        selected: ["샤워실"],
        parkingType: "free",
      }),
    ).toEqual(["샤워실", "주차:무료"]);
  });

  it("parses parking, legacy values, and custom facilities", () => {
    expect(
      parseGymFacilities(["샤워실", "주차:유료", "에어컨", "스팀사우나"], "메모"),
    ).toEqual({
      selected: ["샤워실", "냉·난방", "스팀사우나"],
      parkingType: "paid",
      notes: "메모",
    });
  });

  it("round-trips structured facilities", () => {
    const fields = {
      selected: ["Wi-Fi", "정수기"],
      parkingType: "paid" as const,
      notes: "",
    };
    expect(parseGymFacilities(serializeGymFacilities(fields))).toEqual({
      selected: fields.selected,
      parkingType: fields.parkingType,
      notes: "",
    });
  });
});
