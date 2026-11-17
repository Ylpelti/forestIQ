import { z } from 'zod';
import { propertySchema } from './property';
import { financingSchema } from './finance';
import { timberPricesSchema, valuationAssumptionsSchema } from './valuation';

export const investmentInputSchema = z.strictObject({
  property: propertySchema,
  financing: financingSchema,
  timberPrices: timberPricesSchema,
  valuation: valuationAssumptionsSchema,
});
export type InvestmentInput = z.infer<typeof investmentInputSchema>;
