import { describe, expect, it } from 'vitest';
import { createSyntheticAnalysis } from '../src/data/synthetic-analysis';
import { harvestEventSchema } from '../src/domain/models/analysis';
import { analyzeInvestment } from '../src/domain/analysis/analyze';
import { projectForest } from '../src/domain/forestry/project';
import { generateHarvestStrategies } from '../src/domain/forestry/strategies';
import { compareHarvestStrategies } from '../src/domain/analysis/scenarios';

const fixture = () => createSyntheticAnalysis().data;
function thinningCase() {
  const input = fixture();
  const stand = input.forestry.property.stands[0]!;
  Object.assign(stand, { areaHa: 2, ageYears: 40, merchantableVolumeM3PerHa: 100,
    annualGrowthM3PerHa: 5, sawlogProportion: 0.5 });
  stand.regeneration.costPerHa = 100;
  Object.assign(input.forestry.property, { stands: [stand], totalAreaHa: 2,
    holdingPeriodYears: 5, annualManagementCosts: 10, bareLandValuePerHa: 500 });
  input.timberPrices.pine = { sawlogPerM3: 60, pulpwoodPerM3: 20 };
  input.forestry.harvests = [{ standId: stand.id, type: 'thinning', year: 1, removalProportion: 0.25 }];
  return input;
}

describe('partial thinning', () => {
  it('removes a fraction of available volume without age reset or regeneration cost', () => {
    const result = analyzeInvestment(thinningCase());
    // 200 initial + 10 growth = 210; 25% = 52.5 removed; remaining 157.5.
    expect(result.standYears[0]).toMatchObject({ openingVolumeM3: 200, growthM3: 10,
      harvestedVolumeM3: 52.5, closingVolumeM3: 157.5, closingAgeYears: 41, regenerationCost: 0,
      closingSawlogProportion: 0.5 });
    expect(result.standYears[1]).toMatchObject({ openingVolumeM3: 157.5, growthM3: 10, closingVolumeM3: 167.5 });
    expect(result.annual[0]).toMatchObject({ harvestRevenue: 2100, regenerationCost: 0, operatingCashFlow: 2090 });
    expect(result.terminalValue).toEqual({ land: 1000, timber: 7900, total: 8900 });
    expect(result.cashFlows.slice(1)).toEqual([2090, -10, -10, -10, 8890]);
  });
  it('handles repeated thinning followed by final harvest, regardless of event array order', () => {
    const input = thinningCase();
    input.forestry.harvests.push({ standId: 'S1', year: 2, type: 'thinning', removalProportion: 0.2 },
      { standId: 'S1', year: 3, type: 'final' });
    const result = analyzeInvestment(input);
    expect(result.standYears[1]).toMatchObject({ harvestedVolumeM3: 33.5, closingVolumeM3: 134 });
    expect(result.standYears[2]).toMatchObject({ harvestedVolumeM3: 144, closingVolumeM3: 0, regenerationCost: 200 });
    expect(result.annual.map(row => row.harvestRevenue)).toEqual([2100, 1340, 5760, 0, 0]);
    expect(result.terminalValue.timber).toBe(0);
    expect(result.standYears.reduce((sum, row) => sum + row.harvestedVolumeM3, 0)).toBe(230);
    input.forestry.harvests.reverse();
    expect(analyzeInvestment(input)).toEqual(result);
  });
  it.each([0, 1, -0.1, 1.01, NaN, Infinity])('rejects invalid removal proportion %s', removalProportion => {
    expect(harvestEventSchema.safeParse({ standId: 'S1', year: 1, type: 'thinning', removalProportion }).success).toBe(false);
  });
  it('requires explicit removal and rejects ambiguous final-harvest removal inputs', () => {
    expect(harvestEventSchema.safeParse({ standId: 'S1', year: 1, type: 'thinning' }).success).toBe(false);
    expect(harvestEventSchema.safeParse({ standId: 'S1', year: 1, type: 'final', removalProportion: 0.5 }).success).toBe(false);
  });
  it('allows thinning-only stands, but enforces eligibility and no-harvest restrictions', () => {
    const input = thinningCase(); const stand = input.forestry.property.stands[0]!;
    stand.harvestRestriction = 'thinning-only';
    expect(() => projectForest(input.forestry)).not.toThrow();
    stand.earliestHarvestYear = 2;
    expect(() => projectForest(input.forestry)).toThrow('aikaisintaan');
    stand.earliestHarvestYear = 1; stand.harvestRestriction = 'no-harvest';
    expect(() => projectForest(input.forestry)).toThrow('rajoitus');
  });
  it('rejects conflicting same-year events and events after a final harvest', () => {
    const input = thinningCase();
    input.forestry.harvests.push({ standId: 'S1', year: 1, type: 'final' });
    expect(() => projectForest(input.forestry)).toThrow('samalle vuodelle');
    input.forestry.harvests = [{ standId: 'S1', year: 1, type: 'final' }, { standId: 'S1', year: 3, type: 'thinning', removalProportion: 0.3 }];
    expect(() => projectForest(input.forestry)).toThrow('kiertoajan');
  });
  it('handles zero timber and nearly total thinning without creating or losing volume', () => {
    const input = thinningCase();
    input.forestry.property.stands[0]!.annualGrowthM3PerHa = 0;
    input.forestry.harvests = [{ standId: 'S1', year: 1, type: 'thinning', removalProportion: 0.999999 }];
    const result = analyzeInvestment(input);
    expect(result.standYears[0]!.closingVolumeM3).toBeCloseTo(0.0002, 10);
    expect(result.annual[0]!.harvestRevenue + result.terminalValue.timber).toBeCloseTo(8000, 8);
    input.forestry.property.stands[0]!.merchantableVolumeM3PerHa = 0;
    expect(analyzeInvestment(input).annual[0]!.harvestRevenue).toBe(0);
  });
});

describe('independent strategy scenarios', () => {
  it('generates deterministic early, +5 delayed and staggered schedules', () => {
    const strategies = generateHarvestStrategies(fixture().forestry.property);
    expect(strategies.map(s => s.harvests.map(e => [e.standId, e.year]))).toEqual([
      [['S1', 1], ['S2', 6]], [['S1', 6], ['S2', 11]], [['S1', 1], ['S2', 11]],
    ]);
    expect(strategies.every(s => s.exclusions.some(e => e.standId === 'S3'))).toBe(true);
  });
  it('uses stable ID ordering for ties rather than input-array ordering', () => {
    const input = fixture(); input.forestry.property.stands[1]!.earliestHarvestYear = 1;
    const before = generateHarvestStrategies(input.forestry.property);
    input.forestry.property.stands.reverse();
    expect(generateHarvestStrategies(input.forestry.property)).toEqual(before);
    expect(before[2]!.harvests.map(e => e.year)).toEqual([1, 6]);
  });
  it('excludes restricted and young stands with explicit reasons', () => {
    const property = fixture().forestry.property;
    property.stands[0]!.harvestRestriction = 'no-harvest';
    property.stands[2]!.harvestRestriction = 'none';
    for (const strategy of generateHarvestStrategies(property)) {
      expect(strategy.harvests.map(e => e.standId)).toEqual(['S2']);
      expect(strategy.exclusions).toEqual([{ standId: 'S1', reason: 'restriction' }, { standId: 'S3', reason: 'development-class' }]);
    }
  });
  it('keeps out-of-horizon events visible and reports unavailable scenarios', () => {
    const input = fixture(); input.forestry.property.holdingPeriodYears = 10;
    const scenarios = compareHarvestStrategies(input);
    expect(scenarios[0]!.status).toBe('available');
    for (const scenario of scenarios.slice(1)) {
      expect(scenario.harvests.some(e => e.year === 11)).toBe(true);
      expect(scenario.status).toBe('unavailable');
      if (scenario.status === 'unavailable') expect(scenario.errors.join(' ')).toContain('ylittää');
    }
  });
  it('compares identical initial inventory and common acquisition assumptions without shared mutable results', () => {
    const input = fixture(); const before = structuredClone(input);
    const scenarios = compareHarvestStrategies(input);
    expect(input).toEqual(before);
    expect(scenarios.every(s => s.status === 'available')).toBe(true);
    const available = scenarios.filter(s => s.status === 'available');
    expect(new Set(available.map(s => s.result.incomeValue)).size).toBe(3);
    expect(new Set(available.map(s => JSON.stringify(s.result.annual))).size).toBe(3);
    for (const { result } of available) {
      expect(result.acquisition.total).toBe(156000);
      expect(result.standYears.filter(row => row.year === 1).map(row => row.openingVolumeM3)).toEqual([1100, 1140, 0]);
      for (const row of result.standYears) {
        expect(row.openingVolumeM3 + row.growthM3 - row.harvestedVolumeM3).toBeCloseTo(row.closingVolumeM3, 10);
        expect(row.closingVolumeM3).toBeGreaterThanOrEqual(0);
      }
    }
    const delayed = structuredClone(available[1]!.result);
    available[0]!.result.annual[0]!.cashFlow = 123;
    expect(available[1]!.result).toEqual(delayed);
    expect(compareHarvestStrategies(input)[1]).toEqual(scenarios[1]);
  });
  it('preserves the existing early regression and produces known delayed harvest proceeds', () => {
    const scenarios = compareHarvestStrategies(fixture());
    const early = scenarios[0]!; const delayed = scenarios[1]!;
    if (early.status !== 'available' || delayed.status !== 'available') throw new Error('Expected valid scenarios');
    expect(early.result).toEqual(analyzeInvestment(fixture()));
    // Pine: 1100 + 5*20 + 10 = 1210 m³ at year 6, old-age growth reduction begins then.
    expect(delayed.result.annual[5]!.harvestRevenue).toBeCloseTo(1210 * 54.25, 8);
    expect(delayed.result.annual[10]!.harvestRevenue).toBeCloseTo((1140 + 11 * 30) * 54, 8);
  });
  it('isolates a bad manual schedule but rejects invalid shared inputs', () => {
    const input = fixture(); input.forestry.harvests[0]!.year = -1;
    expect(compareHarvestStrategies(input).every(s => s.status === 'available')).toBe(true);
    input.forestry.property.askingPrice = NaN;
    expect(() => compareHarvestStrategies(input)).toThrow();
  });
  it('returns equal no-harvest results when all stands are restricted rather than inventing differences', () => {
    const input = fixture(); input.forestry.property.stands.forEach(stand => { stand.harvestRestriction = 'no-harvest'; });
    const scenarios = compareHarvestStrategies(input);
    for (const scenario of scenarios) {
      expect(scenario.harvests).toEqual([]);
      expect(scenario.status).toBe('available');
      if (scenario.status === 'available') expect(scenario.result.annual.every(row => row.harvestRevenue === 0)).toBe(true);
    }
  });
});
