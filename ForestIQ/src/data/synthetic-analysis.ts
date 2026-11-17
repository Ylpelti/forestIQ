import { createSyntheticInvestment, labelSyntheticLeaves } from './synthetic-property';
import { analysisInputSchema } from '../domain/models/analysis';

export function createSyntheticAnalysis() {
  const { data: source } = createSyntheticInvestment();
  const data = analysisInputSchema.parse({
    forestry: { property: source.property, growth: { rampYears: 20, declineAgeYears: 80, oldAgeMultiplier: 0.5 },
      harvests: [{ standId: 'S1', year: 1, type: 'final' }, { standId: 'S2', year: 6, type: 'final' }] },
    timberPrices: source.timberPrices,
    nominalDiscountRate: source.valuation.nominalDiscountRate,
    annualInflationRate: source.valuation.annualInflationRate,
  });
  return { data, provenance: labelSyntheticLeaves(data) };
}
