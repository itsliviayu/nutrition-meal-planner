import type { ReactNode } from "react";
import { useLocale } from "../i18n/useLocale";
import { Icon } from "./Icon";

export type AppRoute = "today" | "foods" | "recipes" | "shop" | "settings" | "add-food" | "confirm-food" | "custom-food" | "edit-food" | "recipe-detail" | "saved-recipe-detail";

interface AppShellProps {
  route: AppRoute;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppShell({ route, title, eyebrow, children, onNavigate, showBack = false, onBack }: AppShellProps) {
  const { t } = useLocale();
  const navItems: Array<{ route: AppRoute; label: string; icon: "today" | "foods" | "recipes" | "shop" }> = [
    { route: "today", label: t("nav.today"), icon: "today" },
    { route: "foods", label: t("nav.foods"), icon: "foods" },
    { route: "recipes", label: t("nav.recipes"), icon: "recipes" },
    { route: "shop", label: t("nav.shop"), icon: "shop" },
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__title-group">
          {showBack && (
            <button className="icon-button back-button" type="button" onClick={onBack ?? (() => onNavigate("foods"))} aria-label={t("a11y.goBack")}>
              <Icon name="back" />
            </button>
          )}
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
          </div>
        </div>
        {!showBack && route !== "settings" && (
          <button className="icon-button" type="button" onClick={() => onNavigate("settings")} aria-label={t("a11y.openSettings")}>
            <Icon name="settings" />
          </button>
        )}
      </header>

      <main className="page-content">{children}</main>

      {!showBack && route !== "settings" && (
        <nav className="bottom-nav" aria-label={t("nav.main")}>
          {navItems.map((item) => (
            <button
              type="button"
              key={item.route}
              className={route === item.route ? "bottom-nav__item is-active" : "bottom-nav__item"}
              onClick={() => onNavigate(item.route)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
