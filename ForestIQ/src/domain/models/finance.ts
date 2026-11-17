import { z } from 'zod';
import { fraction, nonnegative } from './property';

export const financingSchema = z.strictObject({
  borrowing: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('principal'), principal: nonnegative }),
    z.strictObject({ kind: z.literal('ltv'), loanToValue: fraction }),
  ]),
  annualInterestRate: nonnegative,
  durationYears: z.number().int().min(1),
  arrangementFees: nonnegative,
  repaymentType: z.enum(['annuity', 'interest-only']),
  requiredEquityReturn: nonnegative,
});
export type Financing = z.infer<typeof financingSchema>;
