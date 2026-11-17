# Unlevered financial conventions (milestones 2 and 3A)

All implemented results are before income tax, without financing. No loan input is accepted by the analysis boundary. Money is euros; stumpage is EUR/m³; rates are decimal fractions in the domain and percentages in the Finnish editor.

## Time zero and nominal annual flows

- Acquisition at time zero = purchase price + purchase price × transfer tax rate + other acquisition costs. The editable transfer-tax default is 0.03 as specified, not a current-law verification.
- Annual flows occur at year end, after growth and any harvest. Harvest revenue = removed physical timber × weighted sawlog/pulpwood stumpage price.
- Management expenses are charged every year on the whole property, including after a final harvest. Regeneration expenses are charged once in each stand's harvest year, including at exit; the cost is not deferred beyond exit.
- All prices and costs are input in time-zero euros. The year-y nominal factor is `(1 + inflation)^y`, applied to stumpage prices, management costs, regeneration costs and bare-land value. The synthetic inflation rate is zero. Discount rate is annual nominal, independent of inflation. Acquisition is not inflated.
- Annual operating cash flow = harvest revenue − regeneration costs − management costs. Negative flows remain visible. No logging cost is separately deducted because stumpage prices represent standing-timber sale proceeds.
- The last year's cash flow adds residual property value once. Earlier annual residual estimates are information only, not cash flows.

## Independent residual and income valuation

Residual value at each year end = land area × assumed bare-land EUR/ha + closing merchantable inventory valued at species-specific stumpage prices, all in that year's nominal euros. Closing inventory excludes harvested timber. Young-stand value beyond merchantable timber is omitted: this can substantially undervalue young forests and seedlings. No selling expenses are modeled yet.

This is a simplified residual estimate, **not** sum-of-parts valuation, comparable-sales valuation or a recursive capitalization of future income. Purchase price, discount rate and calculated income value do not determine residual value. Terminal override, sum-of-parts and manual comparables remain in their planned later milestones.

`incomeValue = Σ(operatingCashFlow[y] / (1 + nominalRate)^y) + residual[H] / (1 + nominalRate)^H`

`projectNPV = incomeValue − acquisitionCost`

NPV's array index is the year: element zero is the immediate acquisition outflow. Income value excludes purchase price and acquisition costs. These quantities use the same forest inventory and operating assumptions; no financing feasibility is inferred.

## Numerical behavior and test oracles

No intermediate rounding. Financial regression tests use 1e-8 EUR decimal precision and physical conservation tests use 1e-10 m³; displayed currencies round to whole euros. Non-finite input and overflowing calculated outputs are rejected rather than rendered as results. Rates must be finite; the analysis uses nonnegative nominal discount rates and inflation greater than -100%.

An independent five-year regression uses acquisition 10,350 EUR, annual flows `[-10, 8590, -10, -10, 990]` and a 10% rate. Year 2 removes 220 m³ at 40 EUR/m³, pays 200 EUR regeneration and 10 EUR management. Residual is 1,000 EUR of land only. The tests explicitly discount these known amounts.

The full synthetic 20-year regression expects acquisition 156,000 EUR, year-1 operating cash flow 51,160 EUR, year-6 operating cash flow 58,680 EUR, and final residual 9,316.1625 EUR. Its remaining timber is 3 m³ regenerated pine plus 72 m³ birch; spruce is still pre-merchantable.

IRR, maximum bid, debt schedules, equity metrics, corporate taxation and sensitivity scenarios are not implemented in this milestone.


## Harvest scenario comparisons and valuation sequencing

Generated and manual scenarios independently use the same initial inventory, prices, acquisition assumptions, discount rate and inflation. Comparisons show annual cash flows (including exit only in the final year), remaining forest value, income valuation and project NPV. Asset value is not an additional annual cash flow. An invalid scenario is unavailable, never represented by zero or stale results.

Sum-of-parts valuation is independent of the harvesting engine and is not required for financing schedules, IRR or maximum bid. Milestone 4 can consume the existing unlevered cash-flow stream and independent residual valuation. Sum-of-parts remains a separate required MVP milestone (3B), after financing; it must not be silently substituted for residual value or combined with income value. The current residual's young-stand undervaluation remains material and must be displayed alongside future financing/maximum-bid results.
