# NASA-TLX Task Tracking
Last updated: 2026-04-16

## Summary
- Phase 0: 0/3 tasks done
- Phase 1: 0/5 tasks done
- Track BE: 0/8 tasks done
- Track FE: 0/11 tasks done

## Phase 0 — Contracts
| ID   | Task                      | Owner | Status      |
|------|---------------------------|-------|-------------|
| P0-1 | src/types/domain.ts       | Both  | Not Started |
| P0-2 | src/lib/query-keys.ts     | Both  | Not Started |
| P0-3 | i18n key tree agreement   | Both  | Not Started |

## Phase 1 — Foundation
| ID   | Task                         | Owner    | Status      |
|------|------------------------------|----------|-------------|
| F1-1 | src/db/schema.ts (6 tables)  | BE-heavy | Not Started |
| F1-2 | src/db/index.ts              | BE-heavy | Not Started |
| F1-3 | src/lib/tlx-constants.ts     | BE-heavy | Not Started |
| F1-4 | DB migration applied to dev  | BE-heavy | Not Started |
| F1-5 | Locales scaffold (EN + ID)   | FE-heavy | Not Started |

## Track BE
| ID   | Task                              | Status      | Depends On    |
|------|-----------------------------------|-------------|---------------|
| BE-1 | studies.ts + participants.ts      | Not Started | F1-1, F1-2    |
| BE-2 | sessions.ts (lifecycle)           | Not Started | BE-1          |
| BE-3 | pairwise.ts                       | Not Started | BE-2          |
| BE-4 | ratings.ts                        | Not Started | BE-2          |
| BE-5 | scores.ts + completeSession()     | Not Started | BE-3, BE-4    |
| BE-6 | results.ts + export.ts            | Not Started | BE-5          |
| BE-7 | Offline queue config + hooks      | Not Started | F1-1          |
| BE-8 | Unit + integration tests          | Not Started | BE-5          |

## Track FE
| ID    | Task                             | Status      | Depends On    |
|-------|----------------------------------|-------------|---------------|
| FE-1  | shadcn install + base components | Not Started | P0-3          |
| FE-2  | App shell / Header rework        | Not Started | FE-1          |
| FE-3  | Route file scaffolds             | Not Started | FE-2          |
| FE-4  | Studies list + create            | Not Started | BE-1, FE-3    |
| FE-5  | Participants management          | Not Started | BE-1, FE-3    |
| FE-6  | Session initiation               | Not Started | BE-2, FE-4    |
| FE-7  | Phase A screens + SubscaleCard   | Not Started | BE-3, FE-6    |
| FE-8  | Phase B screens + TLXSlider      | Not Started | BE-4, FE-6    |
| FE-9  | Completion screen                | Not Started | BE-5, FE-7+8  |
| FE-10 | Session detail + CSV export      | Not Started | BE-6, FE-9    |
| FE-11 | Mobile polish + a11y audit       | Not Started | FE-10         |

## Coordination Checkpoints
| Checkpoint         | Gate                                       | Status      |
|--------------------|--------------------------------------------|-------------|
| Day 2 EOD          | Phase 1 merged, DB live, types frozen      | Not Started |
| Day 4 EOD          | BE-1/2 done → FE-4/5/6 unblocked          | Not Started |
| Day 6 EOD          | BE-3/4 done → FE-7/8 unblocked            | Not Started |
| Day 8 EOD          | All features integrated                    | Not Started |
| Day 9              | QA + a11y audit complete                   | Not Started |
