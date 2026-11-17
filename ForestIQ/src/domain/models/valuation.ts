import { z } from 'zod';
import { nonnegative } from './property';

const priceSchema = z.strictObject({ sawlogPerM3: nonnegative, pulpwoodPerM3: nonnegative });
export const timberPricesSchema = z.strictObject({
  basis: z.literal('assumption'),
  pine: priceSchema,
  spruce: priceSchema,
  birch: priceSchema,
});

// These inputs define contracts only. Component selection rules arrive in milestone 3.
export const valuationAssumptionsSchema = z.strictObject({
  nominalDiscountRate: nonnegative,
  annualInflationRate: z.number().finite().gt(-1),
  terminalValueOverride: nonnegative.nullable(),
  sumOfParts: z.strictObject({
    seedlingValuePerHa: nonnegative,
    youngForestValuePerHa: nonnegative,
    futureYieldExpectationPerHa: nonnegative,
    wholePropertyAdjustmentRate: z.number().finite().min(-1).max(1),
  }),
});
export type TimberPrices = z.infer<typeof timberPricesSchema>;
export type ValuationAssumptions = z.infer<typeof valuationAssumptionsSchema>;
