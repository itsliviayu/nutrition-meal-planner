export type PlanningMode = "free" | "inventory";

export const planningModeFromInventoryOnly = (
  inventoryOnly: boolean,
): PlanningMode => inventoryOnly ? "inventory" : "free";

export const inventoryOnlyFromPlanningMode = (
  mode: PlanningMode,
): boolean => mode === "inventory";
