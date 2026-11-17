import { describe, expect, it } from 'vitest';
import { createSyntheticInvestment } from '../src/data/synthetic-property';
import { investmentInputSchema } from '../src/domain/models/input';
import { propertySchema, standSchema } from '../src/domain/models/property';
import { financingSchema } from '../src/domain/models/finance';

const fixture = () => createSyntheticInvestment().data;

describe('validated investment inputs', () => {
  it('provides three stands, distinct eligibility and young forest', () => {
    const data = fixture();
    expect(investmentInputSchema.parse(data)).toEqual(data);
    expect(data.property.stands).toHaveLength(3);
    expect(data.property.stands.map(s => s.earliestHarvestYear)).toEqual([1, 6, 25]);
    expect(data.property.stands[2]).toMatchObject({ developmentClass: 'young', merchantableVolumeM3PerHa: 0 });
  });
  it('defaults transfer tax to 3% and accepts an override', () => {
    const { transferTaxRate: _rate, ...property } = fixture().property;
    expect(_rate).toBe(0.03);
    expect(propertySchema.parse(property).transferTaxRate).toBe(0.03);
    expect(propertySchema.parse({ ...property, transferTaxRate: 0.02 }).transferTaxRate).toBe(0.02);
  });
  it.each([5, 10, 20, 40])('accepts holding period %s', holdingPeriodYears => {
    expect(propertySchema.safeParse({ ...fixture().property, holdingPeriodYears }).success).toBe(true);
  });
  it.each([-1, NaN, Infinity, '150000', undefined])('rejects invalid price %s', askingPrice => {
    const result = propertySchema.safeParse({ ...fixture().property, askingPrice });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['askingPrice']);
  });
  it.each([
    { totalAreaHa: 0 }, { totalAreaHa: 16 }, { holdingPeriodYears: 7 },
    { transferTaxRate: 1.1 }, { transferTaxRate: -0.01 }, { annualManagementCosts: -1 },
    { name: ' ' }, { stands: [] }, { unexpected: 1 },
  ])('rejects invalid property fields %j', patch => {
    expect(propertySchema.safeParse({ ...fixture().property, ...patch }).success).toBe(false);
  });
  it('rejects duplicate stand IDs at the duplicate path', () => {
    const data = fixture().property;
    const first = data.stands[0]!;
    data.stands[1] = { ...data.stands[1]!, id: first.id };
    const result = propertySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['stands', 1, 'id']);
  });
  it.each([
    { areaHa: -1 }, { ageYears: 1.5 }, { merchantableVolumeM3PerHa: -1 },
    { sawlogProportion: 1.1 }, { annualGrowthM3PerHa: -2 }, { earliestHarvestYear: 0 },
    { species: 'unknown' }, { developmentClass: 'unknown' }, { siteQuality: 'unknown' },
    { harvestRestriction: 'unknown' }, { regeneration: { costPerHa: -1 } },
  ])('rejects invalid stand fields %j', patch => {
    expect(standSchema.safeParse({ ...fixture().property.stands[0], ...patch }).success).toBe(false);
  });
  it('supports zero principal and interest-only loans', () => {
    expect(financingSchema.parse({ ...fixture().financing, borrowing: { kind: 'principal', principal: 0 }, annualInterestRate: 0, repaymentType: 'interest-only' }).borrowing).toEqual({ kind: 'principal', principal: 0 });
  });
  it.each([
    { borrowing: { kind: 'ltv', loanToValue: 1.01 } },
    { borrowing: { kind: 'principal', principal: -1 } },
    { borrowing: { kind: 'principal', principal: 100, loanToValue: 0.5 } },
    { durationYears: 0 }, { durationYears: 2.5 }, { annualInterestRate: -0.1 },
    { repaymentType: 'unknown' }, { arrangementFees: -1 },
  ])('rejects ambiguous or invalid financing %j', patch => {
    expect(financingSchema.safeParse({ ...fixture().financing, ...patch }).success).toBe(false);
  });
  it('rejects missing prices and invalid valuation assumptions', () => {
    const data = fixture();
    expect(investmentInputSchema.safeParse({ ...data, timberPrices: {} }).success).toBe(false);
    expect(investmentInputSchema.safeParse({ ...data, valuation: { ...data.valuation, annualInflationRate: -1 } }).success).toBe(false);
    expect(investmentInputSchema.safeParse({ ...data, valuation: { ...data.valuation, terminalValueOverride: -1 } }).success).toBe(false);
  });
  it('labels every fixture leaf as synthetic', () => {
    const { data, provenance } = createSyntheticInvestment();
    const paths: string[] = [];
    function visit(value: unknown, path: string) {
      if (value === null || typeof value !== 'object') { paths.push(path); return; }
      for (const [key, child] of Object.entries(value)) visit(child, path ? `${path}.${key}` : key);
    }
    visit(data, '');
    expect(Object.keys(provenance).sort()).toEqual(paths.sort());
    expect(paths.length).toBeGreaterThan(70);
    for (const path of paths) expect(provenance[path]).toMatchObject({ kind: 'synthetic', label: expect.stringContaining('Synteettinen') });
  });
  it('returns independent deterministic fixtures', () => {
    const original = fixture();
    const edited = fixture();
    edited.property.stands[0]!.merchantableVolumeM3PerHa = 999;
    expect(fixture()).toEqual(original);
    expect(edited).not.toEqual(original);
  });
});
