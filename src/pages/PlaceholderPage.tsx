import type { AppRoute } from "../components/AppShell";

interface PlaceholderPageProps {
  kind: Extract<AppRoute, "today" | "recipes" | "shop">;
  onOpenFoods: () => void;
}

const content = {
  today: {
    symbol: "☀",
    title: "Your day will take shape here",
    body: "Daily meal planning and nutrition summaries arrive in Phase 2. For now, build a food library the planner can trust.",
  },
  recipes: {
    symbol: "⌁",
    title: "Recipes are coming next",
    body: "Recipe templates and meal combinations are intentionally deferred until the food data foundation is ready.",
  },
  shop: {
    symbol: "○",
    title: "Shopping starts with good data",
    body: "Missing ingredients and smart shopping suggestions are reserved for Phase 3.",
  },
};

export function PlaceholderPage({ kind, onOpenFoods }: PlaceholderPageProps) {
  const item = content[kind];
  return (
    <section className="placeholder-card">
      <div className="placeholder-card__art" aria-hidden="true">{item.symbol}</div>
      <p className="section-kicker">Building the foundation</p>
      <h2>{item.title}</h2>
      <p>{item.body}</p>
      <button className="primary-button" type="button" onClick={onOpenFoods}>Open Food Library</button>
    </section>
  );
}
