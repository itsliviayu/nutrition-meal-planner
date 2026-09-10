import { describe, expect, it } from "vitest";
import {
  inventoryOnlyFromPlanningMode,
  planningModeFromInventoryOnly,
} from "./planningMode";

describe("planning mode mapping", () => {
  it("maps Plan Freely to inventoryOnly false", () => {
    expect(inventoryOnlyFromPlanningMode("free")).toBe(false);
    expect(planningModeFromInventoryOnly(false)).toBe("free");
  });

  it("maps Use What I Have to inventoryOnly true", () => {
    expect(inventoryOnlyFromPlanningMode("inventory")).toBe(true);
    expect(planningModeFromInventoryOnly(true)).toBe("inventory");
  });
});
