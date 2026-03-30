# LEDGR Expense Calculator

LEDGR is a Vite + React personal finance dashboard that helps you parse bank statement data, categorize spending, and visualize expense trends.

## What this app does

- Imports and processes statement transaction data
- Classifies transactions into categories and merchant groups
- Tracks budgets and savings goals
- Surfaces subscriptions and recurring spends
- Provides overview, analysis, insights, and transaction views
- Persists app state locally in browser storage for offline-first usage

## Tech stack

- React 19
- Vite 6
- Recharts for charts and analytics visuals
- Framer Motion for transitions
- pdfjs-dist for PDF parsing
- Lucide React for icons

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Available scripts

- `npm run dev`: start local dev server
- `npm run build`: create production bundle in `dist/`
- `npm run preview`: run local preview server for production build

## GitHub Pages routing notes

- This project is configured as an SPA with GitHub Pages deep-link fallback.
- `vite.config.js` uses `base: "/Ledgr/"` to match deployment at `https://derajyojith.dev/Ledgr/`.
- `public/404.html` redirects unknown paths back to `index.html` with route information.
- `index.html` restores the redirected path on load.

If you redeploy, keep these files unchanged unless you intentionally change hosting strategy.

## GitHub Pages deployment (important)

Do not publish raw source files (`index.html` + `src/`) directly to Pages. This app must be deployed from the Vite build output (`dist/`).

- This repo includes [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) to build and deploy automatically on push to `main`.
- In GitHub repository settings, set Pages source to **GitHub Actions**.
- Custom domain is included via [`public/CNAME`](public/CNAME).

## Project structure

```text
src/
  main.jsx        # Main app and business logic
  styles.css      # Additional styling
public/           # Static assets
merchant_catalog.json
canara_raw.txt
demo_seed.json
```

## Data notes

- `demo_seed.json` contains seeded sample transactions.
- `merchant_catalog.json` powers merchant/category matching.
- Local app data (transactions, budgets, goals, overrides) is stored in browser `localStorage`.

## Notes for contributors

- Keep merchant and category mappings in sync when adding new merchant rules.
- Prefer small, focused commits for parsing or categorization changes.
- If adding new storage keys, keep them centralized in the app constants.

## License
MIT License
