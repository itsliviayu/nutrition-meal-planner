import type { AppRoute } from "../components/AppShell";

interface PlaceholderPageProps {
  kind: Extract<AppRoute, "recipes" | "shop">;
  onOpenFoods: () => void;
}

const content = {
  recipes: {
    symbol: "⌁",
    title: "Recipes are coming next",
    body: "Your generated meals already use recipe templates. Full recipe details and cooking instructions arrive in Phase 3.",
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
