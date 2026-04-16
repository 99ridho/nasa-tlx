# nasa-tlx

A web application to digitize the NASA Task Load Index (NASA-TLX) instrument for workload research studies. Supports multi-participant sessions, bilingual UI (EN/ID), offline operation, and data export.

## Authoritative specs

- `PRD.md` — complete product requirements (FR-SM-01 through FR-RE-03, 18 requirements total)
- `hart-staveland-original-1.pdf` — original 1988 Hart & Staveland methodology paper

When in doubt about instrument behavior, defer to the PDF. When in doubt about feature scope, defer to the PRD.

## Tech stack (planned)

| Layer     | Choice                   | Reason                                         |
| --------- | ------------------------ | ---------------------------------------------- |
| Framework | TanStack Start (RC)      | Full-stack TypeScript, file-based routing, SSR |
| Database  | PostgreSQL + Drizzle ORM | Typed schema, migrations, relational data      |
| UI        | shadcn/ui + Tailwind CSS | Mobile-first, accessible primitives            |
| Data sync | TanStack Query           | Offline queue, background sync                 |
| i18n      | i18next + react-i18next  | EN/ID support                                  |

## Build / test / lint

```
npm run dev          # development server (port 3000)
npm run build        # production build
npm run preview      # preview production build
npm run test         # vitest run
npm run lint         # eslint
npm run check        # prettier --write + eslint --fix
npm run db:generate  # drizzle-kit generate (create migration files)
npm run db:migrate   # drizzle-kit migrate (run pending migrations)
npm run db:push      # drizzle-kit push (push schema directly, dev only)
npm run db:studio    # drizzle-kit studio (local DB browser)
```

## Session lifecycle

```
Study creation
  └─ Participant registration
       └─ Session start
            ├─ Phase A: 15 pairwise comparisons (all C(6,2) pairs, random order)
            └─ Phase B: 6 subscale ratings (0–100 slider, 5-pt steps)
                 └─ Score computation → export
```

No back-navigation is permitted during Phase A or Phase B. This is a methodological requirement, not a UX choice.

## Six subscales

| Code | Name            | Low endpoint | High endpoint |
| ---- | --------------- | ------------ | ------------- |
| MD   | Mental Demand   | Low          | High          |
| PD   | Physical Demand | Low          | High          |
| TD   | Temporal Demand | Low          | High          |
| OP   | Own Performance | Good         | Poor          |
| EF   | Effort          | Low          | High          |
| FR   | Frustration     | Low          | High          |

**Performance (OP) has reversed semantics**: Good = low workload, Poor = high workload. The slider label order differs from the other five subscales.

## Scoring formulas

**Weighted TLX** (primary):

```
WeightedTLX = Σ(rating[i] × weight[i]) / 15
```

where `weight[i]` = number of times subscale `i` was chosen in Phase A pairwise comparisons.

**Raw TLX** (secondary):

```
RawTLX = mean(rating[1..6])
```

Weight sum invariant: weights must always sum to exactly 15 (one point per pairwise pair).

## Domain constraints (non-negotiable)

These are methodology requirements from the original instrument — do not soften or make configurable:

- **Exactly 15 pairwise pairs** — all C(6,2) = 15 combinations of the six subscales
- **Weight sum = 15** — enforced by the pairwise design; validate on score computation
- **Slider range**: 0–100, increments of 5 only
- **No numeric display** to participants during rating — labels at endpoints only
- **No back-navigation** during Phase A or Phase B once started
- **Random pair order** in Phase A per session (not per study)

## Database entities (planned)

- `studies` — researcher-created, contains title, description, task description
- `participants` — linked to a study, identified by code or name
- `sessions` — one per participant attempt; tracks phase progress and status
- `pairwise_responses` — 15 rows per session (Phase A)
- `rating_responses` — 6 rows per session (Phase B)
- `computed_scores` — weighted and raw TLX per session, derived on completion

## i18n

All participant-facing UI strings must be available in both `en` and `id` (Indonesian). Researcher/admin UI is English-only per PRD. Translation keys live under `src/locales/`.
