# ForestIQ implementation plan

## Architecture and scope

All milestones follow AGENTS.md and SPEC.md. Follow the dependency order below. The authorized acquisition-MVP priority splits milestone 3 into harvesting (3A) and independent sum-of-parts valuation (3B): 1 → 2 → 3A → 4 → 3B → 5 → 6 → 7 → 8. Domain modules are pure deterministic TypeScript with no React, persistence, or chart imports.

- `src/domain/models`: Zod boundary schemas and inferred types, explicit units and assumptions.
- `src/domain/forestry`: annual physical inventory, growth and harvest events.
- `src/domain/finance`: acquisition, debt, cash flows and investment metrics.
- `src/domain/valuation`: independent income, sum-of-parts and comparable-sales methods. No financing dependencies.
- `src/data`: explicitly synthetic fixtures; never market quotations or measurements.
- `src/app` and later `src/components`: Finnish UI and adapters for calculated results.
- Later `src/persistence`: versioned localStorage and JSON boundaries validated with Zod.

MVP is milestones 1–8, including manual comparable sales. Deferred: calibrated growth models and official valuation tables, automated transaction retrieval, machine learning, full corporate/personal income taxation, authentication, databases, external APIs, AI and deployment. No deferred feature is required for the local MVP.

## Verification policy

Every milestone runs `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Tests use Vitest, deterministic fixtures, explicit tolerances and independently derived expected values. UI milestones additionally verify desktop/mobile interaction and visible validation; add browser automation when interactions arrive. Do not mark completion based solely on implementation. Record actual commands, outcomes and limitations below.

## 1. Foundation and validated inputs

Status: COMPLETE (2026-11-17). Dependency: none.

Deliverables:
- Next.js App Router, strict TypeScript, Tailwind, ESLint, Vitest and Zod setup with reproducible lockfile.
- Typed property, stands, financing, stumpage assumptions and valuation inputs; development class and site quality included.
- Validation for finite values, ranges, duplicate IDs, area consistency and unambiguous financing choice.
- Three or more clearly synthetic stands, two different harvest eligibility dates and a young stand. Every fixture leaf carries synthetic provenance.
- Finnish foundation page with explicit limitations; README and domain convention documents.

Acceptance: clean install and all verification commands pass; fixture validates; invalid inputs are rejected with useful paths; default transfer tax is editable 3%; holding periods are 5/10/20/40; no engines or fabricated financial results.

Tests: valid fixture/defaults, missing/invalid numbers, ranges, IDs, area consistency, financing alternatives, development and regeneration inputs, provenance coverage and fixture independence.

## 2. First end-to-end unlevered vertical slice

Status: COMPLETE (2026-11-17). Dependency: 1.

Deliverables: age-dependent stand projection, manual final harvest timing, regeneration cycle/costs, management costs, acquisition cost, unlevered annual cash flows, NPV, simple land-plus-remaining-timber residual valuation and income valuation (tuottoarvomenetelmä). Finnish editable property/stand assumptions and one scenario with annual results. Document year-zero versus end-year timing, nominal inflation assumptions and residual limitations.

Acceptance: edits recalculate real results across 5/10/20/40 years; harvest eligibility/restrictions enforced with visible errors; inventory balances opening + growth - removal = closing; no mature volume appears on regeneration; exit excludes harvested timber; income value excludes purchase costs while project NPV includes them. Income residual is independently calculated, never circular. Financing excluded.

Tests: known acquisition/NPV values, zero revenue, final harvest inventory conservation, no double-counting, nonnegative volume, young growth/reset, costs and harvest timing affect income value, terminal asset values, fixed fixture regression. Browser checks: editing/recalculation and invalid inputs at desktop/mobile widths.

## 3A. Harvest strategies and scenario comparison

Status: COMPLETE (2026-11-17). Dependency: 2.

Deliverables: partial thinning with explicit removal percentages; early, five-year delayed and staggered strategies; per-stand manual schedules with multiple thinnings before one final harvest; independently projected scenarios from identical inventory and common economic assumptions; annual cash-flow and remaining-value comparison.

Acceptance: opening + growth − removal = closing for every stand/year; thinning does not reset age or trigger regeneration; final harvest still clears inventory and resets growth; restrictions and eligibility enforced; duplicate same-year events, repeated final harvests, unsupported post-final events and out-of-horizon events produce visible errors. Strategies are deterministic and genuinely differ when assumptions warrant; identical results are allowed when no eligible candidates exist. Manual edits cannot mutate generated scenarios. No claim of globally optimal forest management.

Tests: partial/remnant volumes, strict percentage bounds, repeated thinning followed by final harvest, restrictions, event conflicts, zero/near-total removal, no double-counted revenue/residual, strategy timing/order, exclusions, unavailable scenarios, shared initial inventory and independent results. Existing regression tests retained. Browser checks: percentages, adding/removing events, validation, copying strategies, independent edits, comparison tables and mobile overflow.

### Valuation dependency assessment

Sum-of-parts is an independent valuation method and is not a dependency of the harvest engine or financing. The existing annual unlevered cash flows and independently calculated land-plus-timber residual are sufficient inputs for milestone 4's debt schedules, IRR and NPV-zero maximum bid. Preserve the young-forest residual warning; do not relabel the current residual as full sum-of-parts. Sum-of-parts is moved to 3B after milestone 4, not removed from MVP scope. No financing implementation is included in 3A.

## 4. Financing and complete investment analytics

Status: NOT STARTED. Dependency: 3A (not 3B).

Deliverables: annuity and interest-only schedules; principal/LTV resolution, fees, initial equity, annual before/after-debt cash flows and funding needs; robust project/equity IRR, equity multiple, cumulative funding, net exit proceeds and unlevered maximum bid solving NPV = 0 including price-dependent acquisition costs. Terminal override.

Acceptance: debt at exit deducted exactly once; early sale and loan maturity handled; zero-rate and zero-loan cases valid; no arbitrary IRR fallback, ambiguous/nonexistent roots visibly unavailable; equity multiple includes all contributions. Financing feasibility separate from property valuation and economic bid. Negative cash flows remain visible. Results before income tax.

Tests: zero loan, annuity, zero interest, interest-only balloon, early exit debt, fees, known IRR/NPV, no/multiple meaningful IRR, bid near-zero NPV, funding requirements, terminal override, invariance of property valuation to loan terms. Browser checks: loan editing and unavailable analytics.

## 3B. Independent sum-of-parts valuation (after milestone 4)

Status: NOT STARTED. Dependency: 4 for delivery order; technically depends only on the input models and inventory boundaries from 1–3A.

Deliverables: sum-of-parts valuation (summa-arvomenetelmä) with bare land, merchantable timber, young/seedling values, applicable future yield expectations and whole-property adjustment. Editable assumptions and component inspection. Compare asking price, sum-of-parts, scenario income values and maximum bid, explaining disagreements.

Acceptance: consistent initial inventory; component rules prevent overlapping land/timber/young-stand/yield value; explicit unavailable states for missing data; no claims of official reference tables; independent of loan terms; residual method remains explicitly identified, never silently replaced or combined with another valuation.

Tests: component exclusivity, adjustment arithmetic, missing-data unavailable states, inventory consistency, financing independence and deterministic valuation regressions. Browser checks: assumption editing and valuation details. Run the full verification policy.

## 5. Sensitivity analysis and financial UI

Status: NOT STARTED. Dependencies: 4 and 3B.

Deliverables: price -20%, interest +2 percentage points and growth -25% stresses plus manual changes; NPV/equity IRR/maximum additional funding comparisons. Complete Property, Financing, Investment analysis and Sensitivities sections; Recharts added here for calculated annual cash flows and balances only. Finnish currency/number formatting and restrained responsive layout.

Acceptance: stress assumptions transparent with no probabilities; actual engine data drives charts; measured inputs and assumptions distinguishable; before-tax, nominal rate, young-stand undervaluation and scenario uncertainty notices visible.

Tests: price/interest/growth sensitivity regressions, stress isolation, no source mutation, chart adapter values; browser checks across all four sections, keyboard controls, mobile overflow and validation.

## 6. Manual comparable-sales valuation

Status: NOT STARTED. Dependency: 5.

Deliverables: manual transaction price/date/region/area/timber volume/composition and optional development classes; transparent unit-price metrics and indicative range (kauppa-arvomenetelmä); underlying comparisons inspectable beside other methods and maximum bid.

Acceptance: no comparisons yields explicit unavailable state, never zero or a fabricated prediction; data sources and synthetic inputs labeled; no unsupported statistical calibration; loan terms cannot affect estimates.

Tests: transaction validation, unit conversions, range calculations, empty/missing data, zero denominators, provenance and financing independence. Browser checks: manual entry and valuation comparison.

## 7. Local persistence and portable data

Status: NOT STARTED. Dependency: 6.

Deliverables: versioned localStorage and JSON export/import for full assumptions and scenarios; explicit validation errors and safe recovery.

Acceptance: round-trip preserves values and provenance; malformed/unsupported files do not replace current work; unavailable storage handled; no external services. Persistence never enters engines.

Tests: round-trip, malformed JSON, schema versions, invalid references, unavailable storage; browser checks: reload and import/export recovery.

## 8. MVP verification and documentation

Status: NOT STARTED. Dependency: 7.

Deliverables: complete fixed-property regression suite; end-to-end acquisition, financing, harvest editing and valuation comparisons; finalized README, assumptions, tolerances and limitations.

Acceptance: all SPEC.md calculation regressions covered; physical inventory and cash-flow/debt invariants pass; responsive Finnish flows verified; clean install/test/typecheck/lint/production build succeed; implemented, simplified and deferred features clearly distinguished. No deployment.

Tests: full automated suite and documented desktop/mobile acceptance run; independent expected outputs for synthetic property.

## Verification record

Milestone 1 verified on 2026-11-17:
- `npm ci --prefer-offline --cache /private/tmp/forestiq-npm-cache`: passed; reproducible lockfile install, audit reported zero vulnerabilities.
- `npm test`: 44 tests passed covering valid fixture, defaults, ranges, invalid numbers, duplicate IDs, area consistency, financing variants, regeneration/classification validation, provenance and independent fixtures.
- `npm run typecheck`: passed after production build.
- `npm run lint`: passed with zero warnings after fixing two initial warnings.
- `npm run build`: passed; Next.js generated the static foundation page.
- `npm start -- --hostname 127.0.0.1 --port 3100` plus curl and HTML assertions: passed; Finnish document, synthetic notice and three stands verified. Server stopped after verification. Initial sandbox attempt to bind the port failed with EPERM; approved loopback execution succeeded.
- Initial sandbox dependency download stalled; network-enabled installation and subsequent clean install succeeded.
- Package installation warns that ESLint 9.39.5 is deprecated; lint itself passes. No dependency vulnerabilities reported by npm.
- Browser tooling reported no available browser. Responsive utility classes are present, but desktop/mobile visual inspection remains unverified and must be performed in milestone 2 with its interactive slice. No visual verification is claimed.

At milestone 1 completion, all input/setup acceptance criteria were verified; calculation engines, editing, charts and persistence were not yet implemented.

    
Milestone 2 verified on 2026-11-17:
- Implemented pure stand-level age-dependent growth, final harvest/reset and establishment delay; explicit eligibility, restriction, reference, horizon and duplicate-event validation. No thinning or strategy generator.
- Implemented acquisition costs, annual unlevered operating/exit cash flows, NPV, independent closing-inventory residual and income valuation. The analysis input has no financing fields. Income value excludes purchase-price-dependent acquisition cost; project NPV includes it.
- Finnish editor recalculates property, stand, price, growth, harvest and horizon changes. Invalid inputs hide stale results and show errors. All assumptions are labeled synthetic/user assumptions; cash-flow and physical-inventory tables expose results for audit.
- `npm test`: **72 passed** (44 foundation tests plus 28 projection/analysis tests). Verified conservation and continuity across 5/10/20/40 years, nonnegative inventory, eligibility/restrictions, regeneration delay/ramp, zero revenue/growth, acquisition/NPV, cost/timing response, inflation, terminal exclusion of harvested timber, deterministic nonmutation and independent five-/twenty-year regressions.
- `npm run typecheck`: passed, including browser test types.
- `npm run lint`: passed with no lint warnings.
- `npm run build`: passed; production route generated successfully.
- `npm run test:e2e`: **8 passed**, four interaction cases each at desktop 1280×900 and mobile 390×664 Chromium emulation. Verified price changes preserve income value while changing NPV; harvest edits; every holding period; explicit handling of out-of-horizon events; empty/negative input recovery; eligibility/restriction errors; inventory editing; ledger expansion and absence of document horizontal overflow.
- Reviewed captured desktop/mobile results screenshots. Tables scroll in their own regions; mobile result metrics stack vertically.
- Initial browser setup lacked the matching Chromium revision. A download approval review timed out; retry installed the required revision. Initial interaction run exposed ambiguous test selectors (Next.js has its own alert, and native select labels include option text); selectors were corrected to the main error region and accessible combobox names. Final browser run passes.
- Browser runner emitted harmless NO_COLOR/FORCE_COLOR environment warnings. No outstanding test, type, lint or build failures.
- Unverified: real physical phones, Safari/WebKit and Firefox interactions; browser verification used Chromium desktop/mobile emulation. No claims of calibrated forestry forecasts or full valuation accuracy.

Milestone 2 acceptance criteria are verified. Known model limitations: one final harvest per stand, configurable simplified growth/composition, young-forest undervaluation in residual, no selling expenses, no persistence. Detailed equations and timing are in docs/forestry-assumptions.md and docs/financial-conventions.md. Next: milestone 3 (harvest strategies, thinning and sum-of-parts valuation); not started.


Milestone 3A verified on 2026-11-17:
- Re-read all project instructions and inspected the current source. The directory has no Git metadata, so no Git diff/status baseline was available. Re-ran the unchanged baseline: 72 unit tests, production build and 8 browser tests passed before the new browser bundle was built.
- Extended the discriminated harvest input and existing forestry engine; added separate pure strategy generation and scenario analysis modules. Existing financial/valuation formula modules were retained. Added manual schedule and comparison components; no dependencies or infrastructure added.
- `npm test`: **92 passed**, including all 72 pre-existing tests and 20 new thinning/scenario tests. Independent known-volume and revenue cases cover partial removals followed by a final harvest, as well as unchanged milestone-2 regression outputs.
- `npm run typecheck`: passed after the production build, including new browser tests.
- `npm run lint`: passed with no lint warnings.
- `npm run build`: passed.
- `npm run test:e2e`: **14 passed** (all 8 existing plus 6 new desktop/mobile cases). Verified independent strategy copying/editing, annual comparison, percentage changes and bounds, event addition/removal, collisions, unsupported post-final harvesting, out-of-horizon unavailability, development-class exclusions and no page overflow.
- Reviewed captured desktop/mobile comparison screenshots. Browser verification is Chromium at 1280×900 and mobile emulation at 390×664, not physical-device, Safari or Firefox verification.
- No test/type/lint/build failures remain. Browser runner still reports harmless inherited NO_COLOR/FORCE_COLOR warnings.
- Assumptions requiring real-investment caution: uncalibrated age-based growth does not respond to thinning density; proportional log/pulp removal and common stumpage prices ignore thinning-specific yields/prices; manual eligibility is not a forestry/legal assessment; generated timing rules are heuristics. Residual omits young-stand future yield value and selling expenses. Financing, taxes beyond transfer tax, IRR and maximum bid are not yet implemented. Detailed limitations are in the assumptions documents and Finnish UI.

Harvesting milestone 3A is complete. Original milestone 3 as a whole is not complete: sum-of-parts remains pending as 3B. Next implementation: milestone 4 (financing, complete investment analytics and maximum bid), then 3B before final valuation comparison/MVP signoff.
