# Stride — Habit & Task Studio

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

### Render

Create a **Static Site** in Render and connect this repository. Use:

- **Build command:** `npm install && npm run build`
- **Output directory:** `dist`

In Firebase Console (project `upheld-window-jc62s`), add the Render domain under **Authentication → Settings → Authorized domains**.
