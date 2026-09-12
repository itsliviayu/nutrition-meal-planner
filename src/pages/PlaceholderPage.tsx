import type { AppRoute } from "../components/AppShell";
import { useLocale } from "../i18n/useLocale";

interface PlaceholderPageProps {
  kind: Extract<AppRoute, "recipes" | "shop">;
  onOpenFoods: () => void;
}

export function PlaceholderPage({ kind, onOpenFoods }: PlaceholderPageProps) {
  const { t } = useLocale();
  const item = kind === "recipes"
    ? { symbol: "⌁", title: t("placeholder.recipesTitle"), body: t("placeholder.recipesBody") }
    : { symbol: "○", title: t("placeholder.shopTitle"), body: t("placeholder.shopBody") };
  return (
    <section className="placeholder-card">
      <div className="placeholder-card__art" aria-hidden="true">{item.symbol}</div>
      <p className="section-kicker">{t("placeholder.kicker")}</p>
      <h2>{item.title}</h2>
      <p>{item.body}</p>
      <button className="primary-button" type="button" onClick={onOpenFoods}>{t("today.openFoods")}</button>
    </section>
  );
}
