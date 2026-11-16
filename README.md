# Cadence — Habit & Task Studio

A personal productivity workspace built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Firebase (Auth + Firestore)**. No external AI API keys or backend servers are required.

## Features

- **Habit Tracker & Streaks**: Daily habit check-ins, category filtering, active/longest streak counters, 20-week activity heatmap, and 7-day habit completion charts.
- **Task Planner**: Categorized, priority-tagged (`high` / `medium` / `low`) tasks with due dates, urgent due reminders, and 7-day task activity & completion analytics.
- **Password-Protected Personal Diary**: Private daily journal entries protected with a PBKDF2-salted user passcode and synchronized to Firestore.
- **Themes & True Dark Mode**: Global light/dark mode toggle plus four curated themes (`Classic`, `Ocean`, `Nature`, `Royal`).
- **Preview Demo Mode**: Try the full workspace locally in the browser even without signing in.

## Prerequisites

- **Node.js `>=20.19.0`**
- **npm `>=10`**

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server on port `3000`:
   ```bash
   npm run dev
   ```

3. Run checks & build:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## Available Scripts

- `npm run dev` — Start the Vite development server on port `3000`.
- `npm run build` — Build the static production bundle into `dist/`.
- `npm run preview` — Preview the production `dist/` bundle locally on port `3000`.
- `npm test` — Run unit tests (`src/utils/*.test.ts`) using Node's test runner via `tsx`.
- `npm run lint` — Type-check the codebase with `tsc --noEmit`.
- `npm run clean` — Cross-platform removal of `dist/`.

## Hosting (100% Free, No API Keys Needed)

Because Cadence builds to static files in `dist/` and connects directly to Firebase, you can host it free on **GitHub Pages**, **Vercel**, **Netlify**, **Render Static Site**, or **Cloudflare Pages**.

### GitHub Pages

The included GitHub Actions workflow builds and deploys the site whenever code is pushed to the `main` branch. To enable it:

1. In the GitHub repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow manually from the **Actions** tab.
4. In **Firebase Console** (project `upheld-window-jc62s`), go to **Authentication → Settings → Authorized domains** and add the published domain (without `https://`).

### Other static hosts

Connect the repository to **Vercel**, **Netlify**, **Render Static Site**, or **Cloudflare Pages** and use:

- **Build command:** `npm install && npm run build`
- **Output directory:** `dist`

In Firebase Console, add the deployed domain under **Authentication → Settings → Authorized domains**.
