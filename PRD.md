# Product Requirements Document

# NASA-TLX Mobile-First Web Application

**Version:** 1.2  
**Author:** Draft for Review  
**Status:** In Progress  
**Last Updated:** 2026-04-16

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authoritative Source & Traceability Convention](#2-authoritative-source--traceability-convention)
3. [Core Concepts & Instrument Definition](#3-core-concepts--instrument-definition)
4. [Database Schema](#4-database-schema)
5. [Feature Requirements](#5-feature-requirements)
6. [Scoring Logic](#6-scoring-logic)
7. [Tech Stack](#7-tech-stack)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Out of Scope](#9-out-of-scope)

---

## 1. Overview

This document specifies requirements for a mobile-first web application that faithfully digitises the NASA Task Load Index (NASA-TLX) as described in the original empirical and theoretical development paper. The app targets researchers and practitioners who need to collect workload ratings from participants in field or lab settings via mobile devices.

**Primary goal:** Produce a weighted TLX score per session that is methodologically equivalent to the paper procedure, with optional raw (unweighted) TLX output as a secondary output.

---

## 2. Authoritative Source & Traceability Convention

All requirements in this document are traced to:

> Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX (Task Load Index): Results of empirical and theoretical research. In P. A. Hancock & N. Meshkati (Eds.), _Human Mental Workload_ (pp. 139–183). Elsevier Science Publishers B.V. (North-Holland).

Traceability tags use the format **[H&S p.XXX]** referring to the page number in the chapter as printed. Where multiple pages apply, a range is used (e.g., **[H&S pp.162–163]**).

Requirements without a paper citation are explicitly labelled **Design decision** — indicating a UX, engineering, or ethical choice made by the product team that is not directly derivable from the source paper.

---

## 3. Core Concepts & Instrument Definition

### 3.1 The Six Subscales

The NASA-TLX uses exactly **six** subscales, selected from an original pool of ten based on 16 experiments (n=247 subjects, 3,461 rating entries). Three task-related scales (Mental Demand, Physical Demand, Temporal Demand), one behavior-related performance scale (Performance), one combined effort scale (Effort), and one subject-related scale (Frustration Level) were retained **[H&S pp.162–166]**.

| ID  | Subscale          | Endpoints   | Description                                                                                                                                                                                              |
| --- | ----------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MD  | Mental Demand     | Low / High  | How much mental and perceptual activity was required (thinking, deciding, calculating, remembering, looking, searching, etc.)? Was the task easy or demanding, simple or complex, exacting or forgiving? |
| PD  | Physical Demand   | Low / High  | How much physical activity was required (pushing, pulling, turning, controlling, activating, etc.)? Was the task easy or demanding, slow or brisk, slack or strenuous, restful or laborious?             |
| TD  | Temporal Demand   | Low / High  | How much time pressure did you feel due to the rate or pace at which the tasks or task elements occurred? Was the pace slow and leisurely or rapid and frantic?                                          |
| OP  | Performance       | Good / Poor | How successful do you think you were in accomplishing the goals of the task set by the experimenter (or yourself)? How satisfied were you with your performance in accomplishing these goals?            |
| EF  | Effort            | Low / High  | How hard did you have to work (mentally and physically) to accomplish your level of performance?                                                                                                         |
| FR  | Frustration Level | Low / High  | How insecure, discouraged, irritated, stressed and annoyed versus secure, gratified, content, relaxed and complacent did you feel during the task?                                                       |

> **Source:** Figure 8, "NASA-TLX Rating Scale Definitions" **[H&S p.169]**

**Excluded subscales (and rationale):**

- **Overall Workload (OW):** Replaced by the weighted composite score; its between-subject variability was too high (CV up to 0.50) **[H&S p.166]**.
- **Activity Type (AT):** Did not correlate with OW in any experiment and contributed nothing to OW regression equations **[H&S pp.163–164]**.
- **Stress (ST):** Least independent scale (highly correlated with all other scales except AT); combined with FR into a single Frustration scale **[H&S pp.165–166]**.
- **Fatigue (FA):** Rarely covaried with OW or performance measures; subjects treated it as separate from workload **[H&S p.166]**.
- **Task Difficulty (TD original 10-scale version):** Split into Mental Demand and Physical Demand for diagnostic specificity **[H&S p.162]**.
- **Mental Effort (ME) / Physical Effort (PE):** Merged into single Effort scale (EF); the separate demand subscales (MD, PD) already capture the source specificity **[H&S pp.164–165]**.

### 3.2 The Two-Phase Procedure

A valid NASA-TLX session consists of two sequential phases **[H&S p.170]**:

1. **Phase A — Pairwise Comparisons (Weighting):** The participant decides which subscale contributed _more_ to their workload for the specific task just performed. All C(6,2) = **15 pairs** are presented. The number of times each subscale is selected becomes its weight (range 0–5).
2. **Phase B — Subscale Ratings:** The participant rates the magnitude of each of the 6 subscales on a continuous scale.

**Order:** Both phases must reference the **same specific task** just completed, not abstract or general workload **[H&S pp.166–167]**. The configurable phase order (comparisons-first vs. ratings-first) is a design decision — H&S (1988) does not prescribe or discuss phase ordering.

### 3.3 The Scale Format

The original instrument uses a **continuous 20-increment line** (effectively a 100-point scale in 5-point steps), presented as an **unmarked graphical continuum** bounded only by bipolar endpoint labels **[H&S pp.170–171]**. Numerical values are **not displayed** to the participant during rating — they are assigned during analysis.

> "…graphic scales, represented by an unmarked continuum bounded by extreme anchor values, are preferable." **[H&S p.171]**

The practical range used in analysis is **0–100** with implied 5-point resolution (20 increments). This is implemented digitally as a slider with no numeric display to the user.

### 3.4 Scoring Formula

**Weighted TLX score:**

```
WWL = Σ (subscale_rating[i] × weight[i]) / 15
```

Where:

- `subscale_rating[i]` is the 0–100 rating for subscale i
- `weight[i]` is the count of pairwise selections for subscale i (0–5)
- Denominator is always **15** (total number of comparisons) **[H&S p.170]**

**Raw TLX score (secondary output):**

```
Raw_TLX = mean(subscale_ratings) = Σ(subscale_rating[i]) / 6
```

The raw (unweighted) version is offered as a secondary output because the weighted procedure is the validated method per the paper. The equal-weighting scheme was shown to fall between WWL and OW ratings in between-subject variability **[H&S p.152]**.

---

## 4. Database Schema

The schema is designed for multi-study, multi-participant deployment. All tables use UUID primary keys.

### 4.1 Entity-Relationship Overview

```
Study ──< Session ──< PairwiseComparison (15 rows per session)
                 └──< SubscaleRating     (6 rows per session)
                 └── TLXScore            (1 row per session, computed)
Study ──< Participant
Participant ──< Session
```

### 4.2 Table: `studies`

Represents a research study or data collection project.

| Column        | Type         | Constraints             | Description                                                              |
| ------------- | ------------ | ----------------------- | ------------------------------------------------------------------------ |
| `id`          | UUID         | PK, NOT NULL            | Unique study identifier                                                  |
| `name`        | VARCHAR(255) | NOT NULL                | Study name                                                               |
| `description` | TEXT         | NULLABLE                | Study description / context                                              |
| `task_label`  | VARCHAR(255) | NOT NULL                | Label for the task being evaluated (shown to participants during rating) |
| `created_by`  | VARCHAR(255) | NOT NULL                | Researcher / administrator name or ID                                    |
| `created_at`  | TIMESTAMP    | NOT NULL, DEFAULT NOW() | Creation timestamp                                                       |
| `updated_at`  | TIMESTAMP    | NOT NULL, DEFAULT NOW() | Last update timestamp                                                    |

### 4.3 Table: `participants`

Stores participant metadata within a study.

| Column             | Type         | Constraints               | Description                                                               |
| ------------------ | ------------ | ------------------------- | ------------------------------------------------------------------------- |
| `id`               | UUID         | PK, NOT NULL              | Unique participant identifier                                             |
| `study_id`         | UUID         | FK → studies.id, NOT NULL | Owning study                                                              |
| `participant_code` | VARCHAR(100) | NOT NULL                  | Researcher-assigned anonymous code (e.g., initials + last 4 digits of ID) |
| `created_at`       | TIMESTAMP    | NOT NULL, DEFAULT NOW()   | Registration timestamp                                                    |

**Constraint:** `UNIQUE(study_id, participant_code)`

> **Rationale:** Participant codes must be anonymous; no PII is stored in the application (e.g., no full name, birth date, or national ID). Design decision — ethical data handling requirement for human subjects research.

### 4.4 Table: `sessions`

One session = one administration of the full NASA-TLX instrument (both phases) for one participant after one task performance.

| Column            | Type                                          | Constraints                           | Description                                                                |
| ----------------- | --------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `id`              | UUID                                          | PK, NOT NULL                          | Unique session identifier                                                  |
| `study_id`        | UUID                                          | FK → studies.id, NOT NULL             | Owning study                                                               |
| `participant_id`  | UUID                                          | FK → participants.id, NOT NULL        | Participant                                                                |
| `task_label`      | VARCHAR(255)                                  | NOT NULL                              | Task label for this specific session (inherits from study but overridable) |
| `collection_mode` | ENUM('weighted', 'raw_only')                  | NOT NULL, DEFAULT 'weighted'          | Whether pairwise comparisons were collected **[H&S p.170]**                |
| `phase_order`     | ENUM('comparisons_first', 'ratings_first')    | NOT NULL, DEFAULT 'comparisons_first' | Order of Phase A and B                                                     |
| `status`          | ENUM('in_progress', 'completed', 'abandoned') | NOT NULL, DEFAULT 'in_progress'       | Session state                                                              |
| `started_at`      | TIMESTAMP                                     | NOT NULL                              | When the session began                                                     |
| `completed_at`    | TIMESTAMP                                     | NULLABLE                              | When all data were submitted                                               |
| `notes`           | TEXT                                          | NULLABLE                              | Researcher annotations                                                     |

### 4.5 Table: `pairwise_comparisons`

Stores each of the 15 pairwise comparison decisions. One row per pair per session.

| Column         | Type                                | Constraints                | Description                                              |
| -------------- | ----------------------------------- | -------------------------- | -------------------------------------------------------- |
| `id`           | UUID                                | PK, NOT NULL               | Unique row identifier                                    |
| `session_id`   | UUID                                | FK → sessions.id, NOT NULL | Owning session                                           |
| `pair_index`   | SMALLINT                            | NOT NULL, CHECK (0–14)     | Pair sequence index (0-based)                            |
| `subscale_a`   | ENUM('MD','PD','TD','OP','EF','FR') | NOT NULL                   | First subscale in the pair                               |
| `subscale_b`   | ENUM('MD','PD','TD','OP','EF','FR') | NOT NULL                   | Second subscale in the pair                              |
| `selected`     | ENUM('MD','PD','TD','OP','EF','FR') | NOT NULL                   | Which subscale the participant selected as more relevant |
| `responded_at` | TIMESTAMP                           | NOT NULL                   | Timestamp of response                                    |

**Constraint:** `UNIQUE(session_id, pair_index)`

**The canonical 15 pairs** (C(6,2), all combinations):

| pair_index | subscale_a | subscale_b |
| ---------- | ---------- | ---------- |
| 0          | MD         | PD         |
| 1          | MD         | TD         |
| 2          | MD         | OP         |
| 3          | MD         | EF         |
| 4          | MD         | FR         |
| 5          | PD         | TD         |
| 6          | PD         | OP         |
| 7          | PD         | EF         |
| 8          | PD         | FR         |
| 9          | TD         | OP         |
| 10         | TD         | EF         |
| 11         | TD         | FR         |
| 12         | OP         | EF         |
| 13         | OP         | FR         |
| 14         | EF         | FR         |

> **Source:** "Fifteen comparisons would be required to decide which member of each pair of the six factors was most significant in creating the level of workload experienced in performing a particular task." **[H&S p.170]**

### 4.6 Table: `subscale_ratings`

Stores the raw magnitude rating for each subscale. One row per subscale per session (6 rows per completed session).

| Column            | Type                                | Constraints                | Description                                                               |
| ----------------- | ----------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `id`              | UUID                                | PK, NOT NULL               | Unique row identifier                                                     |
| `session_id`      | UUID                                | FK → sessions.id, NOT NULL | Owning session                                                            |
| `subscale`        | ENUM('MD','PD','TD','OP','EF','FR') | NOT NULL                   | Which subscale                                                            |
| `raw_value`       | SMALLINT                            | NOT NULL, CHECK (0–100)    | Raw rating 0–100 (mapped from slider position in 5-point steps)           |
| `slider_position` | DECIMAL(5,2)                        | NOT NULL                   | Exact slider position as percentage (0.00–100.00), retained for precision |
| `responded_at`    | TIMESTAMP                           | NOT NULL                   | Timestamp of response                                                     |

**Constraint:** `UNIQUE(session_id, subscale)`

> **Scale precision note:** The original instrument presents ratings on a 12-cm line with values 1–100 assigned during analysis **[H&S pp.170–171]**. The 5-point step resolution (20 increments) follows the recommendation that "the optimal range of rating steps is from 10 to 20" **[H&S p.171]**. Slider position is stored at full precision; `raw_value` is the snapped value to the nearest 5-point increment for scoring.

### 4.7 Table: `tlx_scores`

Computed scores stored after session completion. One row per session.

| Column         | Type         | Constraints                        | Description                                                      |
| -------------- | ------------ | ---------------------------------- | ---------------------------------------------------------------- |
| `id`           | UUID         | PK, NOT NULL                       | Unique identifier                                                |
| `session_id`   | UUID         | FK → sessions.id, UNIQUE, NOT NULL | One score record per session                                     |
| `weight_md`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Mental Demand                                         |
| `weight_pd`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Physical Demand                                       |
| `weight_td`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Temporal Demand                                       |
| `weight_op`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Performance                                           |
| `weight_ef`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Effort                                                |
| `weight_fr`    | SMALLINT     | NOT NULL, CHECK (0–5)              | Weight for Frustration                                           |
| `weighted_tlx` | DECIMAL(6,2) | NULLABLE                           | Weighted TLX score (WWL), NULL if `collection_mode = 'raw_only'` |
| `raw_tlx`      | DECIMAL(6,2) | NOT NULL                           | Unweighted mean of 6 subscale ratings                            |
| `computed_at`  | TIMESTAMP    | NOT NULL                           | When scores were calculated                                      |

**Constraint:** `weight_md + weight_pd + weight_td + weight_op + weight_ef + weight_fr = 15` (when `collection_mode = 'weighted'`)

> **Source:** "Fifteen comparisons would be required…" and weighted score formula **[H&S pp.170, 152]**

---

## 5. Feature Requirements

### 5.1 Study Management

#### FR-SM-01: Create Study

**Status:** ✅ Done  
**Description:** A researcher can create a new study with a name, description, and default task label.  
**Source:** Design decision — administrative requirement; no specific paper citation.  
**Acceptance Criteria:**

- Required fields: `name`, `task_label`
- `description` is optional
- Study is assigned a UUID automatically
- Study appears in the study list after creation

#### FR-SM-02: Manage Participants

**Status:** ✅ Done  
**Description:** A researcher can add participants to a study using anonymous codes.  
**Source:** Design decision — ethical data handling requirement for human subjects research; the paper does not specify a participant identification scheme.  
**Acceptance Criteria:**

- Participant code is researcher-defined (e.g., initials + last 4 digits of student ID)
- Duplicate codes within a study are rejected
- No PII fields (no full name, birth date, national ID number)

#### FR-SM-03: Edit Study

**Status:** ✅ Done  
**Description:** A researcher can edit an existing study's name, description, and task label.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Edit form pre-populated with current study values
- Required fields: `name`, `task_label`
- `description` is optional
- Saving updates `updated_at` timestamp
- If any sessions exist, a non-blocking warning is shown: "Changing the task label will not retroactively update existing sessions."

#### FR-SM-04: Delete Study

**Status:** ✅ Done  
**Description:** A researcher can delete a study and all its associated data.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Delete action requires a confirmation dialog naming the study and stating all data will be permanently removed
- Cascade deletes: participants → sessions → pairwise_comparisons → subscale_ratings → tlx_scores
- Studies with in-progress sessions show an additional warning
- After deletion, researcher is redirected to the study list

### 5.2 Session Initiation

#### FR-SI-01: Start a New Session

**Status:** ✅ Done  
**Description:** A researcher or participant can start a new TLX session for a specific participant within a study.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Researcher selects study → selects or creates participant → starts session
- Session records `started_at` timestamp
- `task_label` is displayed prominently throughout the session to anchor ratings to a specific task

#### FR-SI-02: Task Context Display

**Status:** ✅ Done  
**Description:** The task label must be visible on every screen during Phases A and B.  
**Source:** "Subjective estimates of weighting parameters would have been more useful had they been obtained with reference to a specific experience (e.g., the experimental task) rather than in the abstract." **[H&S pp.166–167]**  
**Acceptance Criteria:**

- Task label is shown as a persistent header or contextual reminder on each comparison and rating screen
- Label is not editable by the participant during the session

#### FR-SI-03: Collection Mode Selection

**Status:** ✅ Done  
**Description:** The researcher can choose whether to collect pairwise comparison weights (full weighted TLX) or ratings only (raw TLX).  
**Source:** Raw TLX (equal weighting) produces an intermediate result between WWL and OW **[H&S p.152]**; weighted is the validated method **[H&S p.170]**.  
**Acceptance Criteria:**

- Default mode is `weighted` (full two-phase procedure)
- `raw_only` mode skips Phase A entirely
- Mode is locked once a session begins

#### FR-SI-04: Batch Session Launch with Direct Participant Links

**Status:** ✅ Done  
**Description:** A researcher can launch sessions for multiple participants simultaneously and share each participant a direct URL they use to self-administer the instrument on their own device.  
**Source:** Design decision.  
**Acceptance Criteria:**

Session creation:

- "Start Session" dialog now allows multi-select: researcher can select one, multiple, or all participants (excluding those with an existing in-progress session)
- "Select all eligible" shortcut selects all participants without an active session
- One session is created per selected participant in a single action

Direct participant links:

- After creation, the UI displays a list of participant code + session link pairs
- Each link targets `/session/$sessionId/start` — a landing page that shows the task label and a "Begin" button, before entering Phase A or Phase B
- Links are copy-to-clipboard per row; a "Copy all" option copies all links as a formatted list
- Links are accessible without authentication — the session ID is the only credential
- The `/session/$sessionId/start` landing page is participant-facing (bilingual EN/ID); it shows the task label and collection mode but no researcher-visible metadata
- Participant links grant access only to the session identified by the ID in the URL; they provide no pathway to researcher-protected routes (`/studies`)

### 5.3 Phase A — Pairwise Comparisons

#### FR-PA-01: Present All 15 Pairs

**Status:** ✅ Done  
**Description:** The app presents all 15 pairwise combinations of the 6 subscales, one at a time.  
**Source:** "Fifteen comparisons would be required to decide which member of each pair of the six factors was most significant in creating the level of workload experienced in performing a particular task." **[H&S p.170]**  
**Acceptance Criteria:**

- Exactly 15 comparisons are shown — no more, no fewer
- Each comparison shows both subscale names and their full descriptions
- The participant selects one subscale per pair
- No pair is repeated
- All C(6,2) = 15 unique pairs from {MD, PD, TD, OP, EF, FR} are covered

#### FR-PA-02: Randomise Pair Order

**Status:** ✅ Done  
**Description:** The order in which the 15 pairs are presented is randomised per session.  
**Source:** The paper states pairs were "presented in a different random order to each subject" **[H&S p.148]**. The principle is adopted here for the six-subscale version; the specific application to this digital implementation is a design decision.  
**Acceptance Criteria:**

- Pair presentation order is randomised at session start
- The randomised order is stored (via `pair_index` in `pairwise_comparisons`) for auditability
- Left/right position of each subscale within a pair is also randomised

#### FR-PA-03: Display Subscale Descriptions During Comparison

**Status:** ✅ Done  
**Description:** Each subscale in a pair is shown with its full label and descriptive text, not just its acronym.  
**Source:** Full descriptions are specified in Figure 8 **[H&S p.169]** to ensure participants understand each dimension.  
**Acceptance Criteria:**

- Both subscale labels and descriptions are visible before the participant selects
- Descriptions match exactly the text in Figure 8 of the paper (see Section 3.1 above)
- Layout is readable on a mobile screen (≤ 390px width)

#### FR-PA-04: Progress Indicator

**Status:** ✅ Done  
**Description:** A progress indicator shows how many of the 15 comparisons have been completed.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Shows "X of 15" or a progress bar
- Updates after each selection

#### FR-PA-05: No Back Navigation During Phase A

**Status:** ✅ Done  
**Description:** Once a pairwise comparison is submitted, the participant cannot change it.  
**Source:** Design decision — the paper does not address back-navigation. This constraint is a UX implementation choice to preserve response integrity.  
**Acceptance Criteria:**

- No "back" button during Phase A
- Submitted selections are saved immediately to `pairwise_comparisons`

### 5.4 Phase B — Subscale Ratings

#### FR-PB-01: Present All 6 Subscales for Rating

**Status:** ✅ Done  
**Description:** The participant rates each of the 6 subscales on a continuous scale.  
**Source:** Six subscales as finalised in Figure 8 **[H&S p.169]**.  
**Acceptance Criteria:**

- All 6 subscales are rated: MD, PD, TD, OP, EF, FR
- Each subscale is presented on a separate screen or clearly delineated section
- Subscale name, bipolar endpoints, and description are all visible during rating

#### FR-PB-02: Continuous Slider — No Numeric Display

**Status:** ✅ Done  
**Description:** Each subscale is rated using a continuous horizontal slider. No numerical value is shown to the participant.  
**Source:** "…graphic scales, represented by an unmarked continuum bounded by extreme anchor values, are preferable." and "Numerical values were not displayed, but values ranging from 1 to 100 were assigned to scale positions during data analysis." **[H&S pp.148, 170–171]**  
**Acceptance Criteria:**

- Slider has no tick marks, no number labels, and no live readout of the numeric value
- Only the two endpoint labels are shown (e.g., "Low" and "High")
- Slider spans the full usable width of the mobile screen
- Internal value is recorded as `slider_position` (0.00–100.00) and snapped to nearest 5-point increment for `raw_value`

#### FR-PB-03: Endpoint Labels Match the Paper

**Status:** ✅ Done  
**Description:** Bipolar endpoint labels must match those specified in Figure 8 of the paper.  
**Source:** Figure 8 **[H&S p.169]**  
**Acceptance Criteria:**

| Subscale          | Left Endpoint | Right Endpoint |
| ----------------- | ------------- | -------------- |
| Mental Demand     | Low           | High           |
| Physical Demand   | Low           | High           |
| Temporal Demand   | Low           | High           |
| Performance       | Good          | Poor           |
| Effort            | Low           | High           |
| Frustration Level | Low           | High           |

Note: **Performance** is the only subscale with non-symmetric endpoints (Good → Poor, not Low → High). This must be preserved exactly.

#### FR-PB-04: Default Slider Position

**Status:** ✅ Done  
**Description:** The slider has no default pre-selected position. It must require an explicit gesture from the participant before being considered answered.  
**Source:** Design decision — the paper does not specify interaction behaviour for a digital slider. This constraint ensures participants make a deliberate response rather than accepting an arbitrary default.  
**Acceptance Criteria:**

- Slider thumb is not shown until the participant interacts with the track
- "Next" / "Submit" is disabled until the participant has moved the slider
- An unset slider is visually distinct from a set one

#### FR-PB-05: Subscale Order Randomisation

**Status:** ✅ Done  
**Description:** The order in which the 6 subscales are presented for rating is randomised per session.  
**Source:** Design decision — the paper does not specify the presentation order of subscales during rating. Randomisation is adopted to mitigate order effects in repeated-measures contexts.  
**Acceptance Criteria:**

- Presentation order is randomised at session start
- Order is stored for auditability

#### FR-PB-06: Subscale Descriptions Visible During Rating

**Status:** ✅ Done  
**Description:** The full description of a subscale is shown while the participant rates it.  
**Source:** Figure 8 descriptions **[H&S p.169]** ensure the participant understands what they are rating.  
**Acceptance Criteria:**

- Description text is displayed above or alongside the slider
- Description is readable without scrolling on a standard mobile screen

### 5.5 Session Completion & Score Computation

#### FR-SC-01: Automatic Weight Computation

**Status:** ✅ Done  
**Description:** After Phase A, the app computes each subscale's weight as the count of times it was selected across the 15 pairs.  
**Source:** "The member of each pair selected as most relevant to workload was recorded and the number of times each factor was selected was computed. The resulting values could range from 0 (not relevant) to 8 (more important than any other factor)." — for the 9-factor version; for 6 factors, the range is 0–5. **[H&S p.148]**  
**Acceptance Criteria:**

- Weight per subscale = count of selections out of 15 pairs
- Sum of all 6 weights always equals 15
- Computed weights are stored in `tlx_scores`

#### FR-SC-02: Weighted TLX Score Computation

**Status:** ✅ Done  
**Description:** The app computes the weighted TLX score (WWL) from weights and ratings.  
**Source:** Formula derived from **[H&S pp.148, 152, 170]**  
**Acceptance Criteria:**

- Formula: `WWL = Σ(rating[i] × weight[i]) / 15`
- Result is rounded to 2 decimal places
- Stored in `tlx_scores.weighted_tlx`
- Displayed to the researcher (not necessarily the participant) after session completion

#### FR-SC-03: Raw TLX Score Computation

**Status:** ✅ Done  
**Description:** The app also computes and stores the unweighted mean of all 6 subscale ratings.  
**Source:** Equal-weighting scheme discussed as intermediate option **[H&S p.152]**  
**Acceptance Criteria:**

- Formula: `Raw_TLX = mean of 6 ratings`
- Stored in `tlx_scores.raw_tlx`
- Clearly labelled as "Raw TLX" to distinguish from the weighted score

#### FR-SC-04: Session Completion Confirmation

**Status:** ✅ Done  
**Description:** A clear confirmation screen is shown when both phases are complete.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Displays weighted TLX score and raw TLX score
- Displays the per-subscale weight profile as a visual summary
- Displays each subscale's rating
- Allows the researcher to add session notes before final submission

### 5.6 Results & Export

#### FR-RE-01: Study-Level Results View

**Status:** ✅ Done  
**Description:** A researcher can view aggregated results across all sessions in a study.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Displays mean ± SD for: weighted TLX, raw TLX, and each subscale rating, per study
- Displays mean weight per subscale across sessions
- Sessions can be filtered by participant or date

#### FR-RE-02: Session-Level Results View

**Status:** ✅ Done  
**Description:** A researcher can view full detail for any individual session.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Shows all 15 pairwise comparison decisions with pair index and timestamps
- Shows all 6 subscale ratings with slider values and timestamps
- Shows computed weights and TLX scores

#### FR-RE-03: CSV Export

**Status:** ✅ Done  
**Description:** A researcher can export session data in CSV format.  
**Source:** Design decision.  
**Acceptance Criteria:**

- One row per session in the wide-format export
- Columns: `session_id`, `participant_code`, `task_label`, `started_at`, `completed_at`, `weight_md`, `weight_pd`, `weight_td`, `weight_op`, `weight_ef`, `weight_fr`, `rating_md`, `rating_pd`, `rating_td`, `rating_op`, `rating_ef`, `rating_fr`, `weighted_tlx`, `raw_tlx`
- Export is downloadable as `.csv`

### 5.7 Authentication

#### FR-AU-01: Researcher Route Authentication

**Status:** ✅ Done  
**Description:** All researcher-facing routes are protected by a login page with JWT-based session.  
**Source:** Design decision.  
**Acceptance Criteria:**

- The following route prefixes require a valid auth cookie to access:
  - `/` (redirects to `/studies` if authenticated, otherwise to `/login`)
  - `/studies/*` (all study management, participant management, results)
- Credentials are configured via environment variables: `AUTH_USERNAME`, `AUTH_PASSWORD`, and `JWT_SECRET`
- No user database is required — a single shared researcher credential is sufficient
- Unauthenticated requests to protected routes receive an HTTP 302 redirect to `/login`
- Credentials are validated on the server side in `beforeLoad` guards; client-side-only checks are not sufficient
- A logout button in the Header clears the cookie and redirects to `/login`
- Session links (`/session/*`) are explicitly excluded from the auth requirement (see FR-AU-02)

#### FR-AU-02: Participant Route Isolation

**Status:** ✅ Done  
**Description:** Participant-facing session routes are publicly accessible without authentication, and provide no pathway to researcher-protected routes.  
**Source:** Design decision.  
**Acceptance Criteria:**

- Routes under `/session/*` do not call `checkAuth` and are publicly accessible
- No navigation element, link, or redirect on any `/session/*` page leads to `/studies` or any other protected route
- A participant who manually navigates to `/studies` (e.g., by editing the URL) is redirected to `/login` — they are not silently granted access
- The `/session/$sessionId/start` landing page (FR-SI-04) contains only: task label, collection mode indicator, language selector, and a "Begin" button — no researcher metadata or links

---

## 6. Scoring Logic

### 6.1 Weight Derivation (Full Algorithm)

```
Input: 15 pairwise_comparisons[session_id]

weights = {MD: 0, PD: 0, TD: 0, OP: 0, EF: 0, FR: 0}

FOR each comparison IN pairwise_comparisons:
    weights[comparison.selected] += 1

ASSERT sum(weights.values()) == 15
```

### 6.2 Weighted TLX Computation

```
Input: weights (from 6.1), ratings (from subscale_ratings[session_id])

weighted_tlx = (
    ratings[MD] * weights[MD] +
    ratings[PD] * weights[PD] +
    ratings[TD] * weights[TD] +
    ratings[OP] * weights[OP] +
    ratings[EF] * weights[EF] +
    ratings[FR] * weights[FR]
) / 15

raw_tlx = mean(ratings[MD], ratings[PD], ratings[TD],
               ratings[OP], ratings[EF], ratings[FR])
```

### 6.3 Edge Case: Zero-Weight Subscale

A subscale with `weight = 0` is valid and contributes zero to the weighted TLX. This reflects the participant's judgement that the subscale was irrelevant to their workload experience for that task. The original 9-factor procedure noted weight values "could range from 0 (not relevant) to 8 (more important than any other factor)" **[H&S p.148]**; the same logic applies to the 6-subscale version (range 0–5).

### 6.4 Raw Value Mapping

Slider positions (0.00–100.00) are mapped to `raw_value` as:

```
raw_value = round(slider_position / 5) * 5
```

This enforces 5-point step resolution consistent with the recommendation that "the optimal range of rating steps is from 10 to 20" and values assigned 1–100 during analysis **[H&S pp.170–171]**. Both the exact `slider_position` and the snapped `raw_value` are stored.

---

## 7. Tech Stack

| Layer                     | Technology                               | Rationale                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**             | TanStack Start (RC)                      | Type-safe routing via TanStack Router; explicit server functions (`createServerFn`) suit strict session state transitions; TanStack Query first-class for immediate per-response persistence |
| **Language**              | TypeScript                               | End-to-end type safety from DB schema to UI components                                                                                                                                       |
| **Database**              | PostgreSQL                               | Non-negotiable; enforces `CHECK` constraints (weight sum = 15, slider range 0–100) and `UNIQUE` pair index per session at the DB level                                                       |
| **ORM**                   | Drizzle ORM                              | Schema-as-code maps 1:1 to PRD schema; `check()` constraints enforced at ORM level before hitting Postgres; plain-SQL proximity aids auditability                                            |
| **UI Components**         | shadcn/ui                                | WCAG 2.1 AA-compliant primitives; Slider component satisfies FR-PB-02 (unmarked continuum) and NFR 8.4 (ARIA, keyboard, contrast) out of the box                                             |
| **Styling**               | Tailwind CSS                             | Mobile-first utility classes; ships with shadcn/ui                                                                                                                                           |
| **State / Data Fetching** | TanStack Query                           | Offline queue + sync when connectivity restores (NFR 8.2); cache behaviour maps onto immediate-persist requirement (FR-PA-05, FR-PB-04)                                                      |
| **i18n**                  | i18next + react-i18next                  | Externalisable string keys for EN/ID simultaneous release (NFR 8.5)                                                                                                                          |
| **Deployment**            | Node.js server (self-hosted or cloud VM) | PostgreSQL connection requirement rules out edge runtime; compatible with Vercel/Render/Railway Node targets                                                                                 |

---

## 8. Non-Functional Requirements

### 8.1 Mobile-First Design

- Primary viewport target: 375–430px width (iPhone SE to iPhone 15 Plus)
- All interactive elements (slider, selection buttons) must have a minimum touch target of 44×44px (Apple HIG)
- No horizontal scrolling on any screen

### 8.2 Offline Capability

- Phases A and B must be completable without network connectivity once a session has started
- Data is queued locally and synced when connectivity is restored

### 8.3 Data Integrity

- Each pairwise comparison response is persisted immediately upon selection
- Each subscale rating is persisted immediately upon confirmation
- Sessions can be resumed if interrupted (from the last unanswered item)

### 8.4 Accessibility

The app must conform to **WCAG 2.1 Level AA** as the minimum standard. Key criteria relevant to this instrument:

- **1.4.3 Contrast (Minimum):** Text and UI components must meet a 4.5:1 contrast ratio (3:1 for large text and UI components such as slider tracks and buttons)
- **1.4.11 Non-text Contrast:** Slider track, thumb, and endpoint labels must meet 3:1 contrast against their background
- **2.1.1 Keyboard:** All interactions (slider, pair selection, navigation) must be operable via keyboard; slider responds to arrow keys with 5-point increments matching the scale resolution
- **2.4.3 Focus Order:** Focus order must follow a logical reading sequence through each screen
- **2.4.7 Focus Visible:** Keyboard focus indicator must be clearly visible on all interactive elements
- **3.3.1 Error Identification:** If a participant attempts to advance without responding, the unanswered item is identified in text (not colour alone)
- **4.1.2 Name, Role, Value:** Slider must expose its current value, min, max, and label via ARIA (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`); since numeric values are hidden visually, `aria-valuenow` exposes the internal 0–100 value to assistive technology only
- Minimum touch target: 44×44px for all interactive elements (satisfies WCAG 2.5.5 Target Size at AAA; required here as a AA-level implementation decision given the mobile-first context)

### 8.5 Language Support

- **Initial release: English and Indonesian (Bahasa Indonesia)** — both languages ship simultaneously
- Language is selectable at the study level and overridable per session
- All subscale labels, descriptions, endpoint labels, and UI strings must be fully externalisable (i18n-ready string keys); no hardcoded display text in component logic
- Subscale descriptions in Indonesian must follow KBBI-compliant formal language (e.g., _"Seberapa besar aktivitas mental dan perseptual yang dibutuhkan…"_); translations are subject to back-translation validation before release
- Date/time formatting must respect locale (`en-US` vs `id-ID`)

---

## 9. Out of Scope

The following are explicitly excluded from this application's requirements:

| Item                                            | Rationale                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Overall Workload (OW) single-item global rating | Replaced by computed WWL; high between-subject variability documented **[H&S p.166]**         |
| Activity Type (AT) subscale                     | Excluded from final NASA-TLX after empirical analysis **[H&S pp.163–164]**                    |
| Fatigue (FA) subscale                           | Excluded from final NASA-TLX after empirical analysis **[H&S p.166]**                         |
| Stress (ST) subscale                            | Excluded from final NASA-TLX after empirical analysis **[H&S pp.165–166]**                    |
| Reference task administration                   | Advanced feature for calibrating raters; not part of the core instrument **[H&S pp.171–172]** |
| Physiological workload measures                 | Beyond the subjective rating scope of the instrument **[H&S p.141]**                          |
| NASA-TLX paper version (printable PDF)          | Separate deliverable; not part of this app                                                    |
| SWAT (Subjective Workload Assessment Technique) | Different instrument **[H&S pp.167–168]**                                                     |

---

_End of Document_
