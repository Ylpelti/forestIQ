# ForestIQ

Finnish forest acquisition scenario analysis. Milestones 2 and 3A implement a local end-to-end unlevered slice: editable synthetic property and stand assumptions, manual thinning/final-harvest schedules and early/delayed/staggered comparisons, deterministic annual physical inventory, acquisition costs, cash flows, residual values, income valuation and project NPV. See PLAN.md for delivery progress and verification.

## Local development

Use Node.js 22.18+ and npm. Run `npm ci`, then `npm run dev`; open http://localhost:3000. No accounts, environment variables, API keys or external services are needed. Inputs are in memory and reset on reload; persistence is a later milestone.

Verification commands:

- `npm test`: Vitest domain and input tests.
- `npm run typecheck`: strict TypeScript checking.
- `npm run lint`: ESLint.
- `npm run build`: production build; serve with `npm start`.
- `npx playwright install chromium` (once), then `npm run test:e2e` **after building**: desktop/mobile Chromium tests against a loopback-only production server on port 3100. No external websites are used. Traces are retained for failing tests.

## Try the vertical slice

Edit purchase price: project NPV changes while property income value stays the same. Change stand S1's harvest year to change actual income and inventory. Inspect annual cash flows and the expandable stand ledger. Switch holding periods among 5/10/20/40. The default S2 harvest is year 6: selecting a 5-year horizon reports it as invalid until explicitly removed; no events are silently discarded. Invalid or empty numeric inputs show Finnish errors and hide stale results.

## Architecture

- `src/domain/models`: Zod boundary validation and inferred types; no coercion of external inputs.
- `src/domain/forestry`: physical stand-year projection and configurable age-dependent growth.
- `src/domain/finance`: acquisition costs and discounting.
- `src/domain/valuation`: independently calculated land/timber residual and property income valuation.
- `src/domain/analysis`: deterministic composition of physical, financial and valuation results; no financing data.
- `src/components` and `src/app`: Finnish editor, formatting and tables; no domain math in React.
- `src/data`: fresh synthetic fixtures with per-leaf provenance, including growth and harvest assumptions.

## Assumptions and limitations

Read [financial conventions](docs/financial-conventions.md) and [forestry assumptions](docs/forestry-assumptions.md) for equations, event ordering, units and independent regression values. Every example input is synthetic. Modified inputs are user assumptions, not measurements. Growth and sawlog composition are simplified age ramps, not scientifically calibrated forestry forecasts.

Results are nominal and before income tax. Financing is excluded. Residual is land plus closing merchantable timber, which can undervalue young forests. It is not the full sum-of-parts method. Charts, sum-of-parts, IRR, maximum bid, financing, sensitivities, manual comparable-sales valuation and persistence remain in their ordered milestones. Automated external data, calibrated growth/reference tables, full income taxation, AI, authentication and databases are deferred. No investment recommendations or deployment are provided.


## Harvest strategies and next delivery priority

The editor supports multiple partial thinnings before a single final harvest per stand, explicit removal percentages, and visible schedule errors. The comparison section shows three independently projected default timing strategies, annual cash flows and remaining forest values. Each strategy can be copied into the manual schedule without changing the defaults. Default schedules are transparent heuristics with explicit excluded-stand reasons; out-of-horizon schedules are unavailable rather than silently truncated.

Thinning retains the existing density-independent growth assumption and proportional log/pulp composition. It can overstate post-thinning growth; no thinning-specific prices, harvesting constraints based on basal area or calibrated yield models are available. Do not treat these comparisons as a validated forestry prescription.

Financing and complete investment analytics (milestone 4) are next. Sum-of-parts valuation has been separated into milestone 3B and remains required for the MVP, but is not a dependency of financing or maximum-bid calculations. See PLAN.md for the revised dependency order.
