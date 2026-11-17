import { investmentInputSchema, type InvestmentInput } from '../domain/models/input';

// All values, including names, classifications and prices, are invented examples.
const input: InvestmentInput = investmentInputSchema.parse({
  property: {
    name: 'Esimerkkimetsä (synteettinen)', askingPrice: 150000, totalAreaHa: 15,
    transferTaxRate: 0.03, otherAcquisitionCosts: 1500, annualManagementCosts: 600,
    bareLandValuePerHa: 500, holdingPeriodYears: 20,
    stands: [
      { id: 'S1', areaHa: 5, species: 'pine', ageYears: 75, merchantableVolumeM3PerHa: 220, sawlogProportion: 0.65, annualGrowthM3PerHa: 4, earliestHarvestYear: 1, harvestRestriction: 'none', developmentClass: 'mature', siteQuality: 'medium', regeneration: { costPerHa: 1800, method: 'planting', establishmentDelayYears: 1, merchantableGrowthStartAgeYears: 15 } },
      { id: 'S2', areaHa: 6, species: 'spruce', ageYears: 60, merchantableVolumeM3PerHa: 190, sawlogProportion: 0.6, annualGrowthM3PerHa: 5, earliestHarvestYear: 6, harvestRestriction: 'none', developmentClass: 'maturing', siteQuality: 'fertile', regeneration: { costPerHa: 2000, method: 'planting', establishmentDelayYears: 1, merchantableGrowthStartAgeYears: 15 } },
      { id: 'S3', areaHa: 4, species: 'birch', ageYears: 8, merchantableVolumeM3PerHa: 0, sawlogProportion: 0, annualGrowthM3PerHa: 3, earliestHarvestYear: 25, harvestRestriction: 'thinning-only', developmentClass: 'young', siteQuality: 'medium', regeneration: { costPerHa: 1200, method: 'natural', establishmentDelayYears: 2, merchantableGrowthStartAgeYears: 12 } },
    ],
  },
  financing: { borrowing: { kind: 'ltv', loanToValue: 0.5 }, annualInterestRate: 0.04, durationYears: 15, arrangementFees: 500, repaymentType: 'annuity', requiredEquityReturn: 0.06 },
  timberPrices: { basis: 'assumption', pine: { sawlogPerM3: 70, pulpwoodPerM3: 25 }, spruce: { sawlogPerM3: 72, pulpwoodPerM3: 27 }, birch: { sawlogPerM3: 50, pulpwoodPerM3: 24 } },
  valuation: { nominalDiscountRate: 0.04, annualInflationRate: 0, terminalValueOverride: null, sumOfParts: { seedlingValuePerHa: 1200, youngForestValuePerHa: 2000, futureYieldExpectationPerHa: 0, wholePropertyAdjustmentRate: -0.15 } },
});

export interface SyntheticProvenance {
  kind: 'synthetic';
  label: string;
}

/** JSON-path-like labels cover every input leaf, including null overrides. */
export function labelSyntheticLeaves(value: unknown, path = ''): Record<string, SyntheticProvenance> {
  if (typeof value !== 'object' || value === null) {
    return { [path]: { kind: 'synthetic', label: 'Synteettinen esimerkkitieto – ei mittaus tai markkinahinta.' } };
  }
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) =>
    Object.entries(labelSyntheticLeaves(child, path ? `${path}.${key}` : key))));
}

export function createSyntheticInvestment() {
  const data = investmentInputSchema.parse(structuredClone(input));
  return { data, provenance: labelSyntheticLeaves(data) };
}
