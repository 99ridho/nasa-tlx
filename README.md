# NASA-TLX

A full-stack web application for conducting [NASA Task Load Index (NASA-TLX)](https://humansystems.arc.nasa.gov/groups/tlx/) cognitive workload studies. Supports multi-participant sessions, bilingual UI (English / Indonesian), and CSV data export.

## What it does

**Researchers** create studies, register participants, and generate per-participant session URLs. After data collection they view aggregated results and export raw data as CSV.

**Participants** complete a two-phase instrument:

- **Phase A — Pairwise comparisons** (15 pairs, all C(6,2) combinations, randomised order): determines each subscale's weight for that participant
- **Phase B — Subscale ratings** (six 0–100 sliders, 5-point steps, randomised order): captures subjective ratings on the six NASA-TLX dimensions

The app then computes a **Weighted TLX** score (`Σ(rating × weight) / 15`) and a **Raw TLX** score (`mean of six ratings`) per session.

### The six subscales

| Code | Name             | Low endpoint | High endpoint |
|------|------------------|--------------|---------------|
| MD   | Mental Demand    | Low          | High          |
| PD   | Physical Demand  | Low          | High          |
| TD   | Temporal Demand  | Low          | High          |
| OP   | Own Performance  | Good         | Poor          |
| EF   | Effort           | Low          | High          |
| FR   | Frustration      | Low          | High          |

> Own Performance (OP) has reversed semantics — Good = low workload, Poor = high workload.

## Tech stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Framework   | TanStack Start (SSR, file-based routing) |
| UI          | React 19, shadcn/ui, Tailwind CSS 4  |
| Data        | TanStack Query                       |
| Database    | PostgreSQL + Drizzle ORM             |
| i18n        | i18next + react-i18next (EN / ID)    |
| Auth        | JWT cookies via JOSE                 |
| Testing     | Vitest                               |

## Getting started

### Prerequisites

- Node.js 20+
- A running PostgreSQL instance
- Set `DATABASE_URL` in your environment (e.g. `postgresql://user:pass@localhost/nasa_tlx`)

### Install and run

```bash
npm install
npm run db:migrate   # apply pending migrations
npm run dev          # development server on http://localhost:3000
```

### Production build

```bash
npm run build
npm run preview
```

## Available scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run preview      # preview production build
npm run test         # vitest run
npm run lint         # eslint
npm run check        # prettier --write + eslint --fix
npm run db:generate  # generate migration files from schema changes
npm run db:migrate   # run pending migrations
npm run db:push      # push schema directly (dev only)
npm run db:studio    # open Drizzle Studio (local DB browser)
```

## Project structure

```
src/
├── components/          # Shared UI components (Header, ThemeToggle, TLXSlider, …)
│   └── ui/              # shadcn/ui primitives
├── db/
│   ├── schema.ts        # Drizzle ORM schema (all tables & enums)
│   └── index.ts         # DB client
├── hooks/               # usePairwiseMutation, useRatingMutation
├── lib/
│   ├── tlx-constants.ts # Subscale definitions, pair generation
│   ├── i18n.ts          # i18next setup
│   ├── query-keys.ts    # TanStack Query key factory
│   └── utils.ts
├── locales/
│   ├── en/              # English translations
│   └── id/              # Indonesian translations
├── routes/
│   ├── __root.tsx
│   ├── login.tsx
│   ├── studies/         # Researcher routes: list, create, edit, participants, sessions
│   └── session/
│       └── $sessionId/
│           ├── start.tsx
│           ├── phase-a/$pairIndex.tsx     # 15 pairwise comparison screens
│           ├── phase-b/$subscaleIndex.tsx # 6 rating screens
│           └── complete.tsx
├── server/              # Server functions (auth, CRUD, scoring, CSV export)
└── types/
    └── domain.ts        # Shared TypeScript domain types
```

## Database schema

Five tables managed by Drizzle ORM:

| Table                  | Description                                              |
|------------------------|----------------------------------------------------------|
| `studies`              | Researcher-created studies with task description         |
| `participants`         | Participants linked to a study, identified by a code     |
| `sessions`             | One per participant attempt; tracks status & randomisation state |
| `pairwise_comparisons` | 15 rows per session (Phase A responses)                  |
| `subscale_ratings`     | 6 rows per session (Phase B responses)                   |
| `tlx_scores`           | Computed weighted & raw TLX per session                  |

Sessions store `pairOrder`, `subscaleOrder`, and `sideOrder` as JSONB arrays so each participant sees a fully randomised but reproducible presentation.

## Authentication

Researcher routes (`/studies/*`) are protected by JWT cookie auth. Log in at `/login`; the token is issued as an `HttpOnly` cookie and validated server-side on every researcher route.

Participant session routes (`/session/*`) are intentionally unauthenticated — participants access their session via a direct URL generated by the researcher.

## Domain constraints (methodology)

These are hard requirements from the original Hart & Staveland (1988) instrument and are not configurable:

- Exactly **15 pairwise pairs** — all C(6,2) combinations of the six subscales
- Weights must sum to **exactly 15** (one point per pair)
- Slider range **0–100**, increments of **5** only
- **No numeric display** to participants during rating
- **No back-navigation** during Phase A or Phase B once started
- **Random pair order** per session (not per study)

## Authoritative references

- `PRD.md` — product requirements (FR-SM-01 through FR-RE-03, 18 requirements)
- `hart-staveland-original-1.pdf` — original 1988 methodology paper
