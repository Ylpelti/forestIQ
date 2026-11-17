import { z } from 'zod';
import { analysisInputSchema, type AnalysisInput } from '../models/analysis';
import { generateHarvestStrategies, type HarvestStrategy } from '../forestry/strategies';
import { analyzeInvestment, type InvestmentAnalysis } from './analyze';

export type ScenarioProjection = HarvestStrategy & (
  { status: 'available'; result: InvestmentAnalysis } | { status: 'unavailable'; errors: string[] }
);

/** Each run parses fresh copies of identical inventory and common economic assumptions. */
export function compareHarvestStrategies(raw: AnalysisInput): ScenarioProjection[] {
  // A bad manual schedule must not invalidate otherwise valid generated schedules.
  const shared = analysisInputSchema.parse({ ...raw, forestry: { ...raw.forestry, harvests: [] } });
  return generateHarvestStrategies(shared.forestry.property).map(strategy => {
    try {
      const result = analyzeInvestment({ ...shared, forestry: { ...shared.forestry, harvests: strategy.harvests } });
      return { ...strategy, status: 'available', result };
    } catch (error) {
      if (!(error instanceof z.ZodError) && !(error instanceof RangeError)) throw error;
      return { ...strategy, status: 'unavailable', errors: error instanceof z.ZodError
        ? error.issues.map(issue => issue.message) : [error.message] };
    }
  });
}
