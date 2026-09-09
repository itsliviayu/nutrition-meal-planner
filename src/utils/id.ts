export const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `food-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
