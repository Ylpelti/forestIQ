# Forestry projection conventions (milestones 2 and 3A)

This is a deterministic scenario model, not a scientifically calibrated Finnish yield model. All example assumptions are synthetic. Species, site quality, development class and regeneration method are not calibrated growth predictors here. Species selects the editable stumpage price; regeneration method is descriptive, with its numeric assumptions entered separately.

## Units and annual ordering

Volume inputs are merchantable m³/ha; all projected inventory is total m³ per stand. Area is ha, age an integer number of years. Total property area equals stand area within 1e-6 ha; the editor derives total area from stands. No non-forest land is modeled.

For each stand and simulation year (1 through the holding period):

1. Record opening age and inventory.
2. During an establishment delay, growth is zero and age stays zero; reduce the remaining delay by one. Otherwise compute growth from opening age and increment age by one.
3. At year end, any final harvest removes **all** opening inventory plus this year's growth. Charge area × regeneration cost in the same year. Reset age and inventory to zero, and start the establishment delay for subsequent years.
4. Record closing inventory and age. Closing inventory becomes next year's opening inventory.

The invariant is opening volume + growth − harvested volume = closing volume. There is no rounding within engines; tests reconcile to 1e-10 m³. Display rounding does not change results.

## Explicit growth assumptions

For opening age `a`, stand merchantable growth start age `s`, and configured ramp duration `r`:

`ramp = min(1, max(0, (a - s) / r))`

`growth = areaHa × baseGrowthM3PerHa × ramp × oldAgeFactor`

`oldAgeFactor` is 1 before the configured decline age, and the configured old-age multiplier at/after that age. This simple curve has an explicit step at decline age. The synthetic example uses a 20-year ramp, decline age 80 and multiplier 0.5. All three can be edited. Growth is zero at the exact start age and begins the following year. Existing inventory is retained even when growth is zero.

The existing rotation retains its supplied sawlog proportion. In the regenerated rotation, closing sawlog proportion is the original stand proportion multiplied by the age ramp (without old-age reduction). This is a simplifying composition assumption, not measured log quality. The delay is honored even if regeneration is natural or seeded; its length is an explicit user input.

## Harvest scope and validation

Manual schedules now support multiple partial thinnings followed by at most one final harvest per stand. A thinning removes an explicit fraction strictly greater than zero and less than one of opening volume plus current-year growth. The same fraction is removed from sawlogs and pulpwood, so remaining composition and age are unchanged. Thinning does not incur regeneration cost. No additional harvesting cost is charged because prices are stumpage prices; thinning-specific stumpage discounts are not modeled.

Subsequent growth remains the existing age-based assumption, independent of density. This is an important limitation: large thinning removals can lead to overestimated subsequent growth. There is no scientifically calibrated thinning response, minimum residual basal area or intensity recommendation. The editor's 30% initial thinning removal is a labeled synthetic starting assumption, not a recommendation.

Event years must be integers within the holding period and at/after manual earliest eligibility. `thinning-only` allows thinning but prohibits final harvest; `no-harvest` prohibits both. Unknown IDs, same-stand/same-year collisions, repeated final harvests and any event after final harvest are rejected, regardless of event array order. The new rotation still grows; harvesting it is outside this slice. No event is silently removed or moved when the horizon changes. Select “Ei hakkuuta / poista tapahtuma” explicitly to remove one.

## Default scenario strategies

These are deterministic timing heuristics, not optimal forest management. They generate final harvests for `mature` and `maturing` stands with restriction `none`, using the manually supplied earliest eligible year as the timing authority. Development class can be edited in the UI. Young/seedling stands and restricted stands are excluded with explicit reasons; they remain in inventory and continue growing. Thinning must be specified manually, including for thinning-only stands.

- Early: each candidate's earliest eligible year.
- Delayed: every selected candidate's early year + 5 years.
- Staggered: sort by eligibility year, then stable stand ID; add 0, 5, 10, … years to each stand's early year. This spreads even stands initially eligible on the same date.

No schedule is clipped to fit the horizon. A generated event outside the holding period remains visible and makes that scenario unavailable, rather than silently creating a different strategy. No eligible candidates yields an explicitly empty schedule and valid no-harvest results; strategies may legitimately coincide.

The fixture produces S1/S2 years (1,6), (6,11) and (1,11). S3 is excluded from default harvesting due to its restriction. Every scenario uses identical starting inventory and common economics in an independent engine run. Changing or copying the manual schedule cannot mutate generated scenarios. Shared assumption edits regenerate the default schedules and all results.

An independent thinning regression starts with 200 m³ and adds 10 m³ annual growth: year-1 removal 25% = 52.5 m³, leaving 157.5; year-2 removal 20% of 167.5 = 33.5, leaving 134; year-3 final harvest removes 144. Total removal is 230 m³, exactly initial inventory plus three years' growth. There is no remaining timber to value twice at exit.
