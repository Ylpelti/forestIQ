import { describe, expect, it } from 'vitest';
import { createSyntheticAnalysis } from '../src/data/synthetic-analysis';
import { analyzeInvestment } from '../src/domain/analysis/analyze';
import { projectForest, growthMultiplier } from '../src/domain/forestry/project';
import { acquisitionCosts } from '../src/domain/finance/acquisition';
import { npv } from '../src/domain/finance/discount';
import { incomeValue } from '../src/domain/valuation/income';
import { residualValue } from '../src/domain/valuation/residual';
import type { AnalysisInput } from '../src/domain/models/analysis';

const fixture = () => createSyntheticAnalysis().data;
function simple(): AnalysisInput {
  const input = fixture();
  const stand = input.forestry.property.stands[0]!;
  Object.assign(stand, { areaHa: 2, ageYears: 40, merchantableVolumeM3PerHa: 100,
    annualGrowthM3PerHa: 5, sawlogProportion: 0.5 });
  stand.regeneration = { method: 'planting', costPerHa: 100, establishmentDelayYears: 1, merchantableGrowthStartAgeYears: 10 };
  Object.assign(input.forestry.property, { stands: [stand], totalAreaHa: 2, askingPrice: 10000,
    otherAcquisitionCosts: 50, annualManagementCosts: 10, bareLandValuePerHa: 500, holdingPeriodYears: 5 });
  input.forestry.harvests = [{ standId: 'S1', year: 2, type: 'final' }];
  input.timberPrices.pine = { sawlogPerM3: 60, pulpwoodPerM3: 20 };
  input.nominalDiscountRate = 0.1;
  return input;
}

describe('forestry inventory', () => {
  it('labels synthetic growth and harvest assumptions explicitly', () => {
    const { provenance } = createSyntheticAnalysis();
    expect(provenance['forestry.growth.rampYears']?.kind).toBe('synthetic');
    expect(provenance['forestry.harvests.0.year']?.kind).toBe('synthetic');
  });
  it('uses transparent age-dependent growth including old-age reduction', () => {
    const growth = fixture().forestry.growth;
    expect([0, 10, 15, 20, 30, 80].map(age => growthMultiplier(age, 10, growth))).toEqual([0, 0, 0.25, 0.5, 1, 0.5]);
  });
  it('harvests exactly available inventory and resets age', () => {
    const rows = projectForest(simple().forestry);
    expect(rows[0]).toMatchObject({ openingVolumeM3: 200, growthM3: 10, harvestedVolumeM3: 0, closingVolumeM3: 210 });
    expect(rows[1]).toMatchObject({ openingVolumeM3: 210, growthM3: 10, harvestedVolumeM3: 220, closingVolumeM3: 0, closingAgeYears: 0, regenerationCost: 200 });
    expect(rows.slice(2).map(row => row.closingVolumeM3)).toEqual([0, 0, 0]);
    expect(rows.slice(2).map(row => row.closingAgeYears)).toEqual([0, 1, 2]);
  });
  it.each([5, 10, 20, 40] as const)('conserves every stand-year across %s years', holdingPeriodYears => {
    const input = fixture();
    input.forestry.property.holdingPeriodYears = holdingPeriodYears;
    input.forestry.harvests = [{ standId: 'S1', year: 1, type: 'final' }];
    const rows = projectForest(input.forestry);
    expect(rows).toHaveLength(3 * holdingPeriodYears);
    for (const row of rows) {
      expect(row.openingVolumeM3 + row.growthM3 - row.harvestedVolumeM3).toBeCloseTo(row.closingVolumeM3, 10);
      expect(row.harvestedVolumeM3).toBeLessThanOrEqual(row.openingVolumeM3 + row.growthM3);
      expect(row.closingVolumeM3).toBeGreaterThanOrEqual(0);
      const previous = rows.find(previous => previous.standId === row.standId && previous.year === row.year - 1);
      if (previous) expect(row.openingVolumeM3).toBe(previous.closingVolumeM3);
    }
  });
  it('resumes gradual merchantable growth after establishment and juvenile years', () => {
    const input = simple();
    input.forestry.property.holdingPeriodYears = 20;
    input.forestry.property.stands[0]!.regeneration.merchantableGrowthStartAgeYears = 2;
    const rows = projectForest(input.forestry);
    // Harvest year 2, delay year 3, opening ages 0/1/2 in years 4/5/6.
    expect(rows.slice(2, 6).every(row => row.growthM3 === 0)).toBe(true);
    expect(rows[6]).toMatchObject({ openingAgeYears: 3, growthM3: 0.5, closingVolumeM3: 0.5 });
    expect(rows[6]!.closingSawlogProportion).toBeCloseTo(0.05, 10);
    expect(rows.filter(row => row.regenerationCost > 0)).toHaveLength(1);
  });
  it('handles zero establishment delay without immediate mature inventory', () => {
    const input = simple();
    input.forestry.property.stands[0]!.regeneration.establishmentDelayYears = 0;
    const rows = projectForest(input.forestry);
    expect(rows[2]).toMatchObject({ openingAgeYears: 0, closingAgeYears: 1, growthM3: 0, closingVolumeM3: 0 });
  });
  it.each(['no-harvest', 'thinning-only'] as const)('rejects %s restriction violations', harvestRestriction => {
    const input = simple();
    input.forestry.property.stands[0]!.harvestRestriction = harvestRestriction;
    expect(() => projectForest(input.forestry)).toThrow('rajoitus');
  });
  it.each([0, 1.5, 6, NaN])('rejects invalid/out-of-horizon event year %s', year => {
    const input = simple(); input.forestry.harvests[0]!.year = year;
    expect(() => projectForest(input.forestry)).toThrow();
  });
  it('rejects early harvest, unknown stands and repeated harvests', () => {
    const input = simple(); input.forestry.property.stands[0]!.earliestHarvestYear = 3;
    expect(() => projectForest(input.forestry)).toThrow('aikaisintaan');
    input.forestry.harvests[0]!.standId = 'missing';
    expect(() => projectForest(input.forestry)).toThrow('puuttuu');
    input.forestry.harvests = [{ standId: 'S1', year: 3, type: 'final' }, { standId: 'S1', year: 4, type: 'final' }];
    expect(() => projectForest(input.forestry)).toThrow('vain yksi');
  });
  it('does not mutate inputs and repeats deterministically', () => {
    const input = fixture(); const before = structuredClone(input);
    const first = analyzeInvestment(input);
    expect(input).toEqual(before);
    expect(analyzeInvestment(input)).toEqual(first);
  });
});

describe('unlevered financial and valuation calculations', () => {
  it('calculates purchase-price-dependent acquisition costs', () => {
    expect(acquisitionCosts(simple().forestry.property)).toEqual({ purchasePrice: 10000, transferTax: 300, otherCosts: 50, total: 10350 });
  });
  it('discounts known cash flows with time zero separate', () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 12);
    expect(npv(0, [-100, 50, 60])).toBe(10);
    expect(npv(0.1, [-100, 0, 121])).toBeCloseTo(0, 12);
    expect(() => npv(-1, [100])).toThrow();
    expect(() => npv(0.1, [Infinity])).toThrow();
  });
  it('matches an independently calculated five-year cash-flow case', () => {
    const result = analyzeInvestment(simple());
    expect(result.cashFlows).toEqual([-10350, -10, 8590, -10, -10, 990]);
    const expectedIncome = -10 / 1.1 + 8590 / 1.1 ** 2 - 10 / 1.1 ** 3 - 10 / 1.1 ** 4 + 990 / 1.1 ** 5;
    expect(result.incomeValue).toBeCloseTo(expectedIncome, 8);
    expect(result.projectNpv).toBeCloseTo(expectedIncome - 10350, 8);
    expect(result.terminalValue).toEqual({ land: 1000, timber: 0, total: 1000 });
    expect(result.annual.map(row => row.exitProceeds)).toEqual([0, 0, 0, 0, 1000]);
    expect(result.annual.map(row => row.harvestRevenue)).toEqual([0, 8800, 0, 0, 0]);
  });
  it('keeps income value independent of purchase price and acquisition costs', () => {
    const input = simple(); const base = analyzeInvestment(input);
    input.forestry.property.askingPrice += 1000;
    input.forestry.property.otherAcquisitionCosts += 200;
    const changed = analyzeInvestment(input);
    expect(changed.incomeValue).toBe(base.incomeValue);
    expect(changed.terminalValue).toEqual(base.terminalValue);
    expect(changed.projectNpv - base.projectNpv).toBeCloseTo(-1230, 8);
  });
  it('responds to costs and harvest timing', () => {
    const input = simple(); const base = analyzeInvestment(input);
    input.forestry.harvests[0]!.year = 3;
    expect(analyzeInvestment(input).incomeValue).not.toBeCloseTo(base.incomeValue, 2);
    input.forestry.harvests[0]!.year = 2;
    input.forestry.property.annualManagementCosts += 100;
    const costChange = Array.from({ length: 5 }, (_, i) => 100 / 1.1 ** (i + 1)).reduce((a, b) => a + b, 0);
    expect(analyzeInvestment(input).incomeValue).toBeCloseTo(base.incomeValue - costChange, 8);
  });
  it('has zero revenue without harvest and independently prices remaining inventory', () => {
    const input = simple(); input.forestry.harvests = [];
    const result = analyzeInvestment(input);
    expect(result.annual.every(row => row.harvestRevenue === 0 && row.regenerationCost === 0)).toBe(true);
    expect(result.terminalValue).toEqual({ land: 1000, timber: 10000, total: 11000 });
    expect(result.cashFlows).toEqual([-10350, -10, -10, -10, -10, 10990]);
  });
  it('does not double-count harvest in the exit year', () => {
    const input = simple(); input.forestry.harvests[0]!.year = 5;
    const result = analyzeInvestment(input);
    expect(result.terminalValue.timber).toBe(0);
    expect(result.annual[4]).toMatchObject({ harvestRevenue: 10000, regenerationCost: 200, exitProceeds: 1000, cashFlow: 10790 });
  });
  it('applies nominal inflation consistently, without inflating time zero', () => {
    const input = simple(); input.annualInflationRate = 0.02;
    const result = analyzeInvestment(input);
    expect(result.acquisition.total).toBe(10350);
    expect(result.annual[1]!.operatingCashFlow).toBeCloseTo(8590 * 1.02 ** 2, 8);
    expect(result.terminalValue.total).toBeCloseTo(1000 * 1.02 ** 5, 8);
    expect(result.annual[4]!.cashFlow).toBeCloseTo(990 * 1.02 ** 5, 8);
  });
  it('keeps costs visible even when stumpage prices and growth are zero', () => {
    const input = simple(); input.timberPrices.pine = { sawlogPerM3: 0, pulpwoodPerM3: 0 };
    input.forestry.property.stands[0]!.annualGrowthM3PerHa = 0;
    const result = analyzeInvestment(input);
    expect(result.annual[1]!.cashFlow).toBe(-210);
    expect(result.standYears[1]!.harvestedVolumeM3).toBe(200);
  });
  it('matches the fixed synthetic property over 20 years', () => {
    const result = analyzeInvestment(fixture());
    // S1: 5*(220+4)*54.25 = 60760; S2: 6*(190+6*5)*54 = 71280.
    expect(result.acquisition.total).toBe(156000);
    expect(result.annual[0]!.operatingCashFlow).toBe(51160);
    expect(result.annual[5]!.operatingCashFlow).toBe(58680);
    // S1 new rotation: growth 1+2 m³, closing sawlog share .65*(18-15)/20.
    // S3: .6*(1+...+15) = 72 m³, all pulpwood. S2 remains pre-merchantable.
    expect(result.terminalValue.total).toBeCloseTo(7500 + 3 * (25 + 45 * 0.0975) + 72 * 24, 8);
    const operating = Array.from({ length: 20 }, (_, i) => i === 0 ? 51160 : i === 5 ? 58680 : -600);
    const expectedIncome = operating.reduce((sum, value, i) => sum + value / 1.04 ** (i + 1), 0) + 9316.1625 / 1.04 ** 20;
    expect(result.incomeValue).toBeCloseTo(expectedIncome, 8);
    expect(result.projectNpv).toBeCloseTo(expectedIncome - 156000, 8);
  });
  it('rejects missing residual inventory and non-finite numerical results', () => {
    const input = simple();
    expect(() => residualValue(input.forestry.property, [], input.timberPrices, 1)).toThrow();
    input.forestry.property.askingPrice = Number.MAX_VALUE;
    expect(() => analyzeInvestment(input)).toThrow();
    expect(() => incomeValue([], 1000, 0.1)).toThrow();
  });
});
