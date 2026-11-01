# Y12 Economics Global Economy — topic quiz research

Unit: `y12-economics-global-economy` — **Topic 1: The Global Economy** of the NSW
Economics Stage 6 Syllabus (2009), examined in the **2027 HSC** (the last HSC on the
2009 syllabus; the 2025 syllabus is first examined in 2028). 5 multiple-choice + 4
short-answer per attempt, drawn from a bank of 96 MC + 73 SA. MC is 1 mark; short
answers are 1–6 marks and LLM-graded.

## What the unit is

73 MC and 64 SA questions are copied **word for word** from NSW school trial papers,
with their source shown (school, year, paper, question number) — constitution
Principle V. A further 23 MC and 9 SA are **original** questions written to fill
syllabus gaps; they show the source "Original question". **No HSC questions are used**, so past HSC papers
stay unseen for full practice.

## Sources

- **Syllabus:** the Economics Stage 6 Syllabus (2009), Topic 1 dot points
  (`resources/topic008/01-syllabus-dot-points.md`, extracted from
  `resources/topic008/economics-stage-6-syllabus-2009.*`). The Economics 11–12 Syllabus
  (2025) is reference only: its Year 12 content is first examined in 2028.
- **Question bank:** 21 school trial papers (2017–2025) in
  `resources/y12_economics_trial_exams/`, text-extracted into
  `resources/topic008/text/`. Questions are copied verbatim; new questions are written
  only to fill syllabus gaps.
- **HSC coverage:** `resources/topic008/03-hsc-coverage.md` — how Topic 1 is examined in
  the 2019–2025 HSC papers (counts and command words only, no question text), used to
  calibrate the bank's emphasis, never as a question source.

## Approach

- **Verbatim school questions with the source shown.** Option letters are removed (the
  app shuffles options); tables in the stem become an SVG table; market diagrams are
  redrawn in code. SA sub-part sources keep their part letters (e.g. "Q24(a)",
  "Q22(a)(i)").
- **No HSC questions.** The HSC papers are used only to calibrate which concepts and
  question types to weight (see `03-hsc-coverage.md`).
- **Every answer is worked independently** and checked against the school's key where
  one could be found. A question whose key gives two answers, or whose keyed answer is
  wrong, is replaced (see the transcription log).
- **Diagrams are redrawn in code** by a per-unit `diagram.ts` (never scanned): 19 market
  diagrams (tariff, quota and subsidy demand-and-supply figures) and 13 data tables.

## Bank selection and checking

The pool (`resources/topic008/05-question-pool.tsv`) records every Topic 1 trial
question found across the 21 papers, with its keep/drop decision and reason. Questions
were dropped when they were not Topic 1 (e.g. Lorenz-curve/Gini items from Topic 3,
Australia-specific trade items from Topic 2), when they duplicated an already-selected
question, or when the school's key was demonstrably wrong or ambiguous (`bad_key`).
The transcription log (`resources/topic008/06-transcription-log.md`) records every
change beyond layout and how each answer was checked.

Notable exclusions and corrections:

- **Sydney Boys 2025** — the paper's answer key (page 25) belongs to a different version
  of the paper; its MC answers were worked independently, and four questions with
  demonstrably wrong keys were restored or dropped on their own merits.
- **Knox 2024 Q19/Q20** — the tariff/quota diagram is a raster image; it was read from
  the page and both questions answered (m047, m061).
- Several `bad_key` questions were excluded where the school key was wrong or two
  options were defensible (e.g. Barker 2022 Q13, Baulkham Hills 2022 Q2, Baulkham Hills
  2024 Q20, Newington 2017 Q20).

## The supplement (original questions)

32 original questions (23 MC + 9 SA) fill the gaps in `resources/topic008/07-coverage.md`
— concepts that were below the "at least 4 MC / 3 SA" threshold after transcription:

- `c-global-interdependence` (4 MC + 3 SA) — reading trade and financial-flow statistics;
- `c-economic-forums` (3 MC + 3 SA) — the G20 and the forum-vs-organisation distinction;
- `c-global-economy` (3 MC + 1 SA) — GWP and the global economy;
- `c-development-strategies` (4 MC + 2 SA) — export-led growth, import substitution, SEZs;
- `c-international-business-cycle` (3 MC) — international vs regional cycles, transmission;
- `c-income-wealth-distribution` (3 MC) — income vs wealth, inequality;
- `c-globalisation-effects` (3 MC) — trade/investment/TNCs, growth, environment.

These use hypothetical data (Country A–E) where numbers are needed, so they cannot go
stale; the only real-world figures are historical record, not forecasts.

## Concept coverage

The unit has 14 concepts (`resources/topic008/02-concepts.md`), one per question:

| Concept | Theme |
| --- | --- |
| `c-global-economy` | The global economy and Gross World Product |
| `c-globalisation` | Globalisation and its drivers |
| `c-global-interdependence` | Reading trade and financial-flow statistics |
| `c-international-business-cycle` | International and regional business cycles |
| `c-free-trade` | The case for free trade |
| `c-international-organisations` | WTO, IMF, World Bank, UN, OECD |
| `c-economic-forums` | The G20 and G7/G8 |
| `c-trading-blocs` | Trading blocs, monetary unions, FTAs |
| `c-protection` | Tariffs, quotas, subsidies, local content rules |
| `c-growth-vs-development` | Growth vs development and its indicators |
| `c-economy-classification` | Developing, emerging and advanced economies |
| `c-income-wealth-distribution` | Global distribution of income and wealth |
| `c-globalisation-effects` | Effects of globalisation on growth, environment, etc. |
| `c-development-strategies` | Development strategies and their evaluation |

`c-protection` is the largest concept (it appears in every HSC paper), matching the
bank's emphasis; `c-international-organisations` and `c-economy-classification` are the
next largest, as in the HSC.

## Pipeline files

`resources/topic008/` holds the whole build:

| File | Contents |
| --- | --- |
| `00-sources.md` | sources and the verbatim-question policy |
| `01-syllabus-dot-points.md` | the 2009 Topic 1 dot points |
| `02-concepts.md` | the 14 concept tags |
| `03-hsc-coverage.md` | how Topic 1 is examined in the 2019–2025 HSC |
| `04-key-content.md` | key terms, theory and data per dot point |
| `05-question-pool.tsv` / `05-pool-notes.md` | every candidate with its decision |
| `06-transcription-log.md` | every change beyond layout, and answer checks |
| `07-coverage.md` | counts per concept and the gaps to supplement |
| `batches/` | the transcribed questions (mc-01..04, sa-01..07, sup-*) |

## Errata

The transcription log records every change beyond layout. The notable ones:

- **m007 (Abbotsleigh 2021 Q18):** the paper's curves are not straight through its own
  readings; the redraw uses straight lines through the four readings the question uses
  and omits the $50 equilibrium label.
- **m016 (Ascham 2018 Q14):** the pool's key was A, but the paper's answer table shows B
  (increase tariffs, decrease quotas), which is correct; transcribed as B.
- **m025 (Baulkham Hills 2023 Q6):** the pool recorded A, but the paper's own marking
  criteria give D; transcribed as D.
- **m031 (Knox 2024 Q1):** replaced Baulkham Hills 2025 Q7, whose school key ($8) is
  wrong (the equivalent subsidy is $4).
- **m047/m061 (Knox 2024 Q19/Q20):** the shared grid diagram was read from the page image
  after being wrongly marked "unreadable".
- **m063/m071/m072/m073 (Sydney Boys 2025):** the page-25 key belongs to a different
  version of the paper; these were answered by independent working.
- **s017 (Baulkham Hills 2022 Q22(b)):** keeps the paper's typo "other that Australia"
  verbatim (the check script requires the stem to match the paper).
- **s032 (James Ruse 2021 Q23(b)):** the paper's solutions answer a different question
  ("economic development" instead of "Gross World Product"); answered from first
  principles.
- **s061/s062 (Sydney Boys 2025 Q23(a)/(b)):** no usable marking guideline (the guide
  belongs to a different version of the paper); answered from first principles.