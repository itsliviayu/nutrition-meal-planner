# Nutrition Meal Planner

A mobile-first, nutrition-aware meal planner built with React, TypeScript, Vite and Zustand. V1 data is stored locally in the browser.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm test -- --run
npm run build
```

The production files are written to `dist/` and use the `/nutrition-meal-planner/` base path. The development server continues to use `/`.

## Deployment

GitHub Pages deployment is prepared in `.github/workflows/deploy.yml`. After the repository is available on GitHub:

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to the `main` branch, or run the workflow manually from the **Actions** tab.

The workflow installs locked dependencies, runs the test suite, builds the app and deploys `dist/` with GitHub's official Pages actions.
