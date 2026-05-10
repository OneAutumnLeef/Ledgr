# Ledgr

A luxury personal finance dashboard for Indian bank account holders. Drop in a CSV / TXT / PDF statement from **SBI** or **IOB**, and Ledgr parses, categorizes, and visualizes your spending — entirely client-side, with no backend and no data leaving your browser.

> **Privacy first** — All parsing, categorization, and analytics run in the browser. Transaction data is stored in `localStorage` only. Nothing is uploaded.

---

## Features

- **Statement parser** with auto-detection for SBI and IOB CSV / TXT / PDF exports
- **Merchant normalization engine** — 30+ patterns for brand variants (Zomato, Swiggy, Amazon, etc.)
- **Smart categorization** across 16 categories with manual override + "apply to all similar"
- **Refund detection** and self-transfer reconciliation between accounts
- **Six dashboard tabs**:
  - Overview — KPI cards, spending breakdown, balance curves, recent activity
  - Analysis — weekly category trends, food deep-dive, top merchants, P2P heatmap
  - Subscriptions — recurring spend manager with monthly trend and churn alerts
  - Budget — per-category budgets with progress bars and savings goals
  - Insights — rent alerts, cash flow, subscription audits, anomaly detection
  - Transactions — paginated table with filters and CSV export
- **Multi-account aggregation** — track SBI and IOB side-by-side
- **Dark / light mode** with full theme support
- **Responsive** — mobile bottom tab bar, desktop sidebar
- **Animations** powered by Framer Motion (count-ups, drawer slides, tab transitions)

---

## Tech stack

- **React 19** + Hooks
- **Vite 6** for build tooling
- **Tailwind CSS v4** for styling
- **Recharts** for charts and analytics visuals
- **Framer Motion** for transitions
- **pdfjs-dist** for PDF passbook parsing
- **Lucide React** for icons

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

---

## Available scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Project structure

```text
src/
  main.jsx            # Main app, parser, and business logic
  styles.css          # Additional global styles
public/
  404.html            # SPA fallback for GitHub Pages
  favicon.png
merchant_catalog.json # Merchant / category matching rules
demo_seed.json        # Seeded sample transactions for first-run demo
index.html
vite.config.js
```

---

## Deployment (GitHub Pages)

This repo is configured to deploy to GitHub Pages from a subdirectory.

- `vite.config.js` sets `base: "/Ledgr/"` to match the Pages subpath. Update this if you fork the repo under a different name.
- `public/404.html` provides SPA fallback so deep links resolve to `index.html`.
- `index.html` restores the original route on load.
- A workflow at `.github/workflows/deploy-pages.yml` builds and deploys on push to `main`. In your repo settings, set **Pages → Source → GitHub Actions**.

> Do **not** publish the raw source (`index.html` + `src/`) directly to Pages — always deploy the Vite build output (`dist/`).

---

## Data and storage

- All app state — transactions, budgets, goals, category overrides, theme — is persisted to browser `localStorage`.
- `demo_seed.json` provides sample transactions so the dashboard renders meaningfully before you import a real statement.
- `merchant_catalog.json` powers merchant detection and category mapping.
- No analytics, no telemetry, no third-party calls beyond loading static assets (icon CDN, fonts).

---

## Contributing

- Keep merchant patterns and category mappings in sync when adding new rules.
- Prefer small, focused commits for parsing and categorization changes.
- New `localStorage` keys should go through the centralized constants in `src/main.jsx`.

---

## License

MIT
