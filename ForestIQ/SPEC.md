# ForestIQ — Build a Working MVP

You are a senior full-stack engineer and quantitative software developer.

Build **ForestIQ**, a functional Finnish forest investment acquisition and scenario analysis application.

The target user is an individual forest investor or the owner of a Finnish limited company (Oy) evaluating a forest property acquisition.

The objective is to support real investment decisions—not simply display forest inventory statistics.

## 1. Technology and scope

- Next.js App Router, TypeScript, Tailwind CSS.
- Recharts for financial visualizations.
- Zod for input validation.
- Vitest for testing financial calculations.
- No authentication, database, paid APIs or cloud infrastructure initially.
- Use localStorage and JSON export/import for persistence.
- The application must be functional without an AI model.
- Finnish user interface; English code, tests and documentation.
- Inspect the existing repository before modifying it.

Prioritize a **correct vertical slice** over breadth.

## 2. Domain model

Implement strongly typed models for:

### Forest property
- Property name
- Asking price
- Total area
- Transfer tax percentage (default 3%, editable)
- Other acquisition costs
- Annual management costs
- Estimated bare-land value per hectare
- Investment holding period

### Forest stands
- Unique stand ID
- Area in hectares
- Primary tree species
- Age
- Current merchantable timber volume (m³/ha)
- Sawlog proportion
- Annual timber growth assumption
- Earliest eligible harvest year
- Harvest restrictions
- Regeneration cost per hectare
- Regeneration method and assumptions

### Financing
- Loan principal or LTV
- Interest rate
- Loan duration
- Loan arrangement fees
- Repayment type: annuity or interest-only
- Investor's required rate of return

### Timber prices
- Editable stumpage prices for sawlogs and pulpwood
- Distinguish between different tree species if data is available
- Prices must be identified as assumptions, not live market quotations

Provide a synthetic example property containing at least three stands, including two with different eligible harvest dates and one young stand.

Label every synthetic input.

## 3. Forestry simulation engine

Implement deterministic annual stand-level projections.

Support:

- Growth of existing stands
- Partial thinning with configurable removal percentage
- Final harvest
- Regeneration costs
- New rotation after final harvest
- Different harvest timing for different stands
- Forest management expenses
- Remaining property value at each year

The initial forestry model may be simplified.

However:

1. Never harvest more timber than physically available.
2. A final harvest must remove the harvested standing timber from inventory.
3. Newly regenerated forest must not instantly regain mature timber volume.
4. Do not use the same fixed mature-forest growth assumption for newly planted seedlings.
5. Respect manual harvest eligibility and restriction inputs.
6. Identify model assumptions and uncertainty clearly.
7. Do not claim scientifically validated growth predictions.

Implement a simple age-dependent growth function or transparent yield assumptions.

Keep the forestry engine modular so calibrated Finnish forest growth models can replace it later.

## 4. Harvest scenarios

Implement three default strategies:

**Scenario A: Early harvesting**
Harvest eligible mature stands early, subject to constraints.

**Scenario B: Delayed harvesting**
Postpone selected harvests by five years.

**Scenario C: Staggered harvesting**
Harvest different eligible stands in different years.

Include a basic manual editor where users can modify the harvest year and type for each stand.

All three scenarios must share the same initial property data.

Make sure the scenarios generate genuinely different forest development and financial results when assumptions warrant it.

Call this *scenario comparison*, not globally optimal forest management.

## 5. Financing engine

Calculate annual:

- Opening loan balance
- Interest expense
- Principal repayment
- Closing loan balance
- Cash available after debt service
- Additional investor cash required

Handle both annuity and interest-only loans correctly.

If the property is hypothetically sold before loan maturity, deduct the outstanding loan balance from exit proceeds exactly once.

Show when negative cash flow creates an additional funding requirement.

## 6. Financial analytics

Implement separate unlevered and levered cash-flow calculations.

Calculate:

- Initial total acquisition cost
- Initial equity requirement
- Annual cash flow before financing
- Annual cash flow after financing
- NPV
- Project IRR
- Equity IRR
- Equity multiple
- Cumulative financing requirement
- Remaining forest asset value
- Net exit proceeds
- Maximum purchase price meeting a selected required return

The user must be able to change the holding period between 5, 10, 20 and 40 years.

For exit value:

- Include remaining land and standing timber values.
- Do not double-count harvested timber.
- Treat future property valuation as an estimate.
- Allow users to override estimated terminal value.
- Clearly warn that simplified stumpage valuation may undervalue young growing stands.

For maximum purchase price:

- First calculate the unlevered maximum bid by solving for NPV = 0.
- Account for purchase-price-dependent acquisition costs.
- Display financing feasibility separately.
- Clearly distinguish economic valuation from the price a bank will finance.

Implement a numerically robust IRR solver. If there is no unique meaningful IRR, show an explanatory unavailable state instead of an incorrect number.

Use nominal cash flows consistently with nominal discount and interest rates. Document inflation assumptions.

## 7. Sensitivity analysis

Implement three stress scenarios:

- Timber stumpage prices decrease by 20%.
- Loan interest rate increases by 2 percentage points.
- Forest growth assumptions decrease by 25%.

Also permit manual changes.

Compare NPV, equity IRR and maximum additional funding needs.

Avoid assigning invented probabilities to these scenarios.

## 8. User interface

Build a coherent financial application with four sections.

**A. Property**
Editable investment assumptions, forest stands and acquisition costs.

**B. Financing**
Loan inputs, repayment schedule and equity requirements.

**C. Investment analysis**
Side-by-side scenario comparison, maximum bid, IRR, NPV and annual cash-flow charts.

**D. Sensitivities**
Stress tests, investment risks and assumptions.

Design requirements:

- Professional financial analysis aesthetic.
- Restrained palette, clear typography and information hierarchy.
- Avoid generic gradient dashboards, excessive cards and decorative icons.
- Display values with Finnish number formatting and euro currency.
- Separate measured inputs from hypothetical assumptions.
- All charts must use actual calculated simulation data.
- No decorative placeholder charts masquerading as results.
- Responsive layout suitable for desktop and mobile.

## 9. Taxation

For the first MVP, the authoritative investment calculations must be **before income tax**.

Include the 3% property transfer tax as a configurable acquisition cost.

Do not apply a simplistic 20% tax directly to gross harvesting revenues and call the result an accurate Finnish Oy tax model.

Do not claim to support full corporate taxation, loss carryforwards, forest deductions or shareholder distributions.

Keep the domain model extensible for a future tax module.

## 10. Tests

Implement automated tests for at least:

- Correct acquisition costs
- Zero-loan scenario
- Annuity amortization
- Interest-only loan
- Outstanding debt repayment at exit
- Correct NPV with known cash flows
- Correct IRR with known cash flows
- Maximum bid produces approximately zero NPV
- No timber volume created by harvesting
- No double-counting after final harvest
- Regeneration starts a new growth cycle
- Nonnegative physical volumes
- Zero harvest revenue
- Sensitivity to interest-rate changes
- Sensitivity to timber-price changes
- Correct terminal asset valuation

Add regression tests using a fixed synthetic property with known expected outputs.

## 11. Delivery and implementation process

Work in this order:

1. Inspect the existing repository.
2. Briefly describe the planned architecture.
3. Implement typed domain models and validation.
4. Implement the forestry and financial engines.
5. Implement automated tests.
6. Build a functional user interface around those engines.
7. Add scenario comparisons and sensitivity analysis.
8. Add persistence and JSON export/import.
9. Run tests, type checks, lint and production build.
10. Fix problems and document remaining limitations.

Create a README explaining setup, assumptions, financial conventions and known modelling limitations.

Create a clear distinction between:

- Implemented and tested functionality
- Simplified assumptions
- Features deferred to future iterations

Do not build authentication, an AI chatbot, an external data integration or a database unless the core MVP is already complete.

**Definition of done:** A user can open ForestIQ, edit a synthetic forest acquisition, change loan terms and harvest timing, and immediately see correctly recalculated annual cash flows, IRR, NPV, remaining forest value and maximum bid price. The calculations must be covered by automated tests.


## Forest property valuation methods

Implement a modular valuation layer supporting three
distinct approaches.

### 1. Sum-of-parts valuation (summa-arvomenetelmä)

Estimate property value from:
- Bare land value
- Merchantable standing timber value
- Young forest and seedling stand values
- Applicable future yield expectation values
- Whole-property valuation adjustment

Avoid double-counting land, timber, seedlings,
and future yield expectations.

Add required development-class and site-quality
inputs to the stand model.

Initially use editable, clearly labeled assumptions.
Do not claim to reproduce official Finnish forest
valuation tables without validated reference data.

### 2. Income valuation (tuottoarvomenetelmä)

Estimate forest investment value from:
- Annual projected harvest cash flows
- Forest management and regeneration expenses
- Selected harvest strategy
- Discount rate
- Consistently defined residual forest value

Use the existing deterministic forestry engine.

Distinguish property income value from project NPV,
which additionally considers the purchase price and
acquisition costs.

Prevent circular terminal valuation assumptions.

### 3. Comparable-sales valuation
(kauppa-arvomenetelmä / market price estimation)

Allow manual entry of comparable transactions:
- Transaction price and date
- Geographic region
- Forest area
- Timber volume and composition
- Development classes where available

Calculate transparent comparable-price metrics
and indicative valuation ranges.

Do not present an unsupported statistical price
prediction as an empirically calibrated model.

Defer automated transaction data retrieval and
machine-learning price prediction.

### Valuation comparison

Display:
- Asking price
- Sum-of-parts estimate
- Income valuation by harvest scenario
- Comparable-sales estimate, if data exists
- Maximum economically justified purchase price
- Explanation of disagreements between methods

Allow users to inspect valuation components and
change their assumptions.

Keep valuation methods independent of financing.
Financing feasibility must be shown separately.

### Acceptance criteria

- Methods use consistent initial forest inventory.
- Asset values are not double-counted.
- Income valuation reacts to harvest timing and costs.
- Market estimates identify the underlying comparisons.
- Missing data produces a clear unavailable state.
- All calculations are deterministic and tested.
