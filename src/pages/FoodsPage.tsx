import { useMemo, useState } from "react";
import { FoodCard } from "../components/FoodCard";
import { Icon } from "../components/Icon";
import { useAppStore } from "../stores/useAppStore";
import type { FoodCategory } from "../types";
import { FOOD_CATEGORIES } from "../utils/foodOptions";

interface FoodsPageProps {
  onAdd: () => void;
  onEdit: (id: string) => void;
}

type CategoryFilter = FoodCategory | "all";

export function FoodsPage({ onAdd, onEdit }: FoodsPageProps) {
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
      const matchesSearch = !query || [food.name, food.brand, food.store]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query));
      return matchesSearch
        && (category === "all" || food.category === category)
        && (!inStockOnly || food.inStock)
        && (!favouritesOnly || food.favourite)
        && (!regularOnly || food.regularBuy);
    });
  }, [category, favouritesOnly, foods, inStockOnly, regularOnly, search]);

  return (
    <>
      <section className="intro-copy">
        <p>Your flexible food library and what is currently at home.</p>
        <span>{foods.length} foods · {foods.filter((food) => food.inStock).length} in stock</span>
      </section>

      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Search foods</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search foods, brands or stores" />
      </label>

      <div className="filter-scroll" aria-label="Food category filters">
        <button type="button" className={category === "all" ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory("all")}>All</button>
        {FOOD_CATEGORIES.map((option) => (
          <button type="button" key={option.value} className={category === option.value ? "filter-chip is-active" : "filter-chip"} onClick={() => setCategory(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-row" aria-label="Food status filters">
        <button type="button" className={inStockOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={inStockOnly} onClick={() => setInStockOnly((value) => !value)}>In Stock</button>
        <button type="button" className={favouritesOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={favouritesOnly} onClick={() => setFavouritesOnly((value) => !value)}>Favourite</button>
        <button type="button" className={regularOnly ? "toggle-filter is-active" : "toggle-filter"} aria-pressed={regularOnly} onClick={() => setRegularOnly((value) => !value)}>Regular Buy</button>
      </div>

      <div className="results-heading">
        <span>{filteredFoods.length} {filteredFoods.length === 1 ? "result" : "results"}</span>
        {(search || category !== "all" || inStockOnly || favouritesOnly || regularOnly) && (
          <button type="button" className="text-button" onClick={() => { setSearch(""); setCategory("all"); setInStockOnly(false); setFavouritesOnly(false); setRegularOnly(false); }}>Clear filters</button>
        )}
      </div>

      <section className="food-list" aria-label="Foods">
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
            <h2>No foods found</h2>
            <p>Try a different filter or add a food to your library.</p>
          </div>
        )}
      </section>

      <button className="floating-action" type="button" onClick={onAdd}><Icon name="plus" /> Add Food</button>
    </>
  );
}
