
# ForestIQ — Agent Instructions

## Project context

ForestIQ is a Finnish forest acquisition and investment
scenario analysis application.

Read SPEC.md before making product or architectural decisions.
Follow PLAN.md when implementing planned milestones.

The application supports investment analysis, not guaranteed
forestry forecasts or investment recommendations.

## Core engineering principles

- Prefer correctness, simplicity, and testability.
- Build working vertical slices rather than isolated features.
- Do not add dependencies without a concrete need.
- Inspect existing code before changing it.
- Preserve existing functionality.
- Avoid unrelated refactoring or speculative features.
- Use English for code, tests, comments, and documentation.
- Use Finnish for user-facing application text.

## Architecture

Separate three concerns:

1. Forestry simulation
2. Financial calculations
3. User interface and persistence

Domain engines must be pure, deterministic TypeScript modules.

- No React dependencies in domain calculations.
- No localStorage access inside calculation engines.
- No chart-specific data structures inside domain models.
- Avoid circular dependencies.
- Use explicit types and Zod for external input validation.
- Use Recharts only to visualize calculated data.

## Financial correctness

Financial calculations must be auditable.

- Explicitly distinguish unlevered and levered cash flows.
- Treat time zero separately from annual periods.
- Use consistent nominal rates and cash flows.
- Never double-count harvesting revenues or terminal assets.
- Deduct outstanding debt at exit exactly once.
- Do not conceal negative cash flows.
- Do not use arbitrary IRR fallbacks.
- Clearly identify assumptions and estimates.
- Keep MVP investment metrics before income tax.
- Do not invent market prices or forestry measurements.

Use documented cash-flow conventions and numerical
tolerances. Write regression tests for important formulas.

## Forestry simulation

- Maintain physical timber inventory at stand level.
- Harvests cannot exceed available volume.
- Final harvest resets the stand's growth cycle.
- Regeneration must not immediately produce mature volume.
- Apply age-dependent growth assumptions.
- Respect harvest restrictions and eligibility.
- Never silently discard invalid harvest events.
- Keep growth assumptions configurable and documented.

Forestry projections are simplified scenarios, not
scientifically calibrated Finnish growth forecasts.

## Implementation workflow

For substantial changes:

1. Inspect relevant files and existing tests.
2. Review applicable SPEC.md requirements.
3. Identify affected domain interfaces.
4. Implement the smallest coherent change.
5. Add or update deterministic tests.
6. Run relevant verification commands.
7. Report changes, test results, and limitations.

Follow PLAN.md milestones in order.
Do not silently expand an approved milestone.

## Quality requirements

- Use strict TypeScript.
- Avoid `any` unless justified.
- Use Vitest for calculation tests.
- Test financial invariants and edge cases.
- Verify responsive UI behavior.
- Handle invalid user inputs visibly.
- Run tests, lint, type checks, and build when available.
- Never claim checks passed unless actually executed.

## Safety and repository discipline

- Never commit secrets.
- Do not overwrite user changes without approval.
- Do not perform destructive Git operations.
- Do not deploy or introduce external services without approval.
- Avoid unnecessary network or paid API dependencies.

## Completion reports

After each milestone, summarize:

- Implemented functionality
- Important decisions
- Tests and commands actually run
- Failures or unverified behavior
- Remaining limitations
- Recommended next milestone


## Efficient Development and Verification

### Core principles

- Maintain comprehensive automated test coverage.
- Prefer targeted verification during implementation.
- Run the complete verification suite at milestone boundaries.
- Do not repeatedly inspect unrelated repository files.
- Avoid unnecessarily large command outputs.

### During implementation

1. Identify the modules affected by the change.
2. Inspect relevant source files and interfaces.
3. Run tests covering the changed behavior.
4. Run related integration tests where appropriate.
5. Fix failures introduced by the change.
6. Avoid unrelated refactoring or verification work.

Do not run the entire test suite after every small edit.

### Full verification

Run the complete test suite, typecheck, lint,
production build and relevant E2E tests:

- At milestone completion
- After significant cross-module changes
- Before release
- When targeted verification cannot establish safety

### Test output

- Prefer concise test summaries.
- Inspect detailed failure logs only when needed.
- Do not repeatedly print successful test output.
- Never hide test failures or claim unexecuted checks passed.

### Context efficiency

- Read files selectively based on task scope.
- Avoid repeated full-repository analysis.
- Treat unchanged architecture decisions as established.
- Keep progress reports concise.
- Preserve test coverage when optimizing execution.
