import { useMemo, useState } from "react";
import { FoodCard } from "../components/FoodCard";
import { Icon } from "../components/Icon";
import { useLocale } from "../i18n/useLocale";
import { useAppStore } from "../stores/useAppStore";
import type { FoodCategory } from "../types";
import { FOOD_CATEGORIES } from "../utils/foodOptions";

interface FoodsPageProps {
  onAdd: () => void;
  onEdit: (id: string) => void;
}

type CategoryFilter = FoodCategory | "all";

export function FoodsPage({ onAdd, onEdit }: FoodsPageProps) {
  const { categoryName, foodName, t } = useLocale();
  const foods = useAppStore((state) => state.foods);
  const toggleInStock = useAppStore((state) => state.toggleInStock);
  const toggleFavourite = useAppStore((state) => state.toggleFavourite);
  const toggleRegularBuy = useAppStore((state) => state.toggleRegularBuy);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [regularOnly, setRegularOnly] = useState(false);

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return foods.filter((food) => {
      const matchesSearch = !query || [food.name, foodName(food), food.brand, food.store]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query));
      return matchesSearch
        && (category === "all" || food.category === category)
        && (!inStockOnly || food.inStock)
        && (!favouritesOnly || food.favourite)
        && (!regularOnly || food.regularBuy);
    });
  }, [category, favouritesOnly, foodName, foods, inStockOnly, regularOnly, search]);

  return (
    <>
      <section className="intro-copy">
        <p>{t("foods.intro")}</p>
        <span>{t("foods.count", { total: foods.length, stock: foods.filter((food) => food.inStock).length })}</span>
      </section>

      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">{t("foods.searchA11y")}</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("foods.searchPlaceholder")} />
      </label>

      <div className="filter-scroll" aria-label={t("foods.categoryFilters")}>
        <button type="button" className={category === "all" ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory("all")}>{t("foods.all")}</button>
        {FOOD_CATEGORIES.map((option) => (
          <button type="button" key={option.value} className={category === option.value ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory(option.value)}>
            {categoryName(option.value)}
          </button>
        ))}
      </div>

      <div className="filter-row" aria-label={t("foods.statusFilters")}>
        <button type="button" className={inStockOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={inStockOnly} onClick={() => setInStockOnly((value) => !value)}>{t("common.inStock")}</button>
        <button type="button" className={favouritesOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={favouritesOnly} onClick={() => setFavouritesOnly((value) => !value)}>{t("common.favourite")}</button>
        <button type="button" className={regularOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={regularOnly} onClick={() => setRegularOnly((value) => !value)}>{t("common.regularBuy")}</button>
      </div>

      <div className="results-heading">
        <span>{filteredFoods.length} {t(filteredFoods.length === 1 ? "common.result" : "common.results")}</span>
        {(search || category !== "all" || inStockOnly || favouritesOnly || regularOnly) && (
          <button type="button" className="text-button" onClick={() => { setSearch(""); setCategory("all"); setInStockOnly(false); setFavouritesOnly(false); setRegularOnly(false); }}>{t("action.clearFilters")}</button>
        )}
      </div>

      <section className="food-list" aria-label={t("foods.foodsA11y")}>
        {filteredFoods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onEdit={() => onEdit(food.id)}
            onToggleInStock={() => toggleInStock(food.id)}
            onToggleFavourite={() => toggleFavourite(food.id)}
            onToggleRegularBuy={() => toggleRegularBuy(food.id)}
          />
        ))}
        {filteredFoods.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true">◌</span>
            <h2>{t("foods.emptyTitle")}</h2>
            <p>{t("foods.emptyBody")}</p>
          </div>
        )}
      </section>

      <button className="floating-action" type="button" onClick={onAdd}><Icon name="plus" /> {t("foods.add")}</button>
    </>
  );
}
