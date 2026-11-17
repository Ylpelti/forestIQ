import { z } from 'zod';
import { nonnegative, propertySchema, year } from './property';
import { timberPricesSchema } from './valuation';

export const growthAssumptionsSchema = z.strictObject({
  rampYears: z.number().int().min(1).max(100),
  declineAgeYears: z.number().int().min(1).max(300),
  oldAgeMultiplier: z.number().finite().min(0).max(1),
});
export const harvestEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ standId: z.string().min(1), year, type: z.literal('final') }),
  z.strictObject({ standId: z.string().min(1), year, type: z.literal('thinning'),
    removalProportion: z.number().finite().gt(0).lt(1) }),
]);
export type HarvestEvent = z.infer<typeof harvestEventSchema>;

export const forestryInputSchema = z.strictObject({
  property: propertySchema,
  growth: growthAssumptionsSchema,
  harvests: z.array(harvestEventSchema),
}).superRefine(({ property, harvests }, ctx) => {
  const seen = new Set<string>();
  harvests.forEach((event, index) => {
    const stand = property.stands.find(s => s.id === event.standId);
    const issue = (message: string) => ctx.addIssue({ code: 'custom', path: ['harvests', index], message });
    if (!stand) issue('Hakkuun kuvio puuttuu.');
    else {
      if (event.year < stand.earliestHarvestYear) issue(`Kuvio ${stand.id}: hakkuu sallitaan aikaisintaan vuonna ${stand.earliestHarvestYear}.`);
      if (stand.harvestRestriction === 'no-harvest' || (stand.harvestRestriction === 'thinning-only' && event.type === 'final')) issue(`Kuvio ${stand.id}: hakkuurajoitus estää ${event.type === 'final' ? 'päätehakkuun' : 'harvennuksen'}.`);
    }
    if (event.year > property.holdingPeriodYears) issue('Hakkuuvuosi ylittää sijoitusajan. Muuta vuotta tai valitse Ei hakkuuta.');
    const key = `${event.standId}:${event.year}`;
    if (seen.has(key)) issue(`Kuvio ${event.standId}: samalle vuodelle on useita hakkuita.`);
    seen.add(key);
    const finals = harvests.filter(other => other.standId === event.standId && other.type === 'final');
    if (event.type === 'final' && finals.length > 1) issue('Samalle kuviolle sallitaan tässä versiossa vain yksi päätehakkuu.');
    if (finals.some(final => final.year < event.year)) issue(`Kuvio ${event.standId}: päätehakkuun jälkeisen kiertoajan hakkuita ei tueta.`);
  });
});
export const analysisInputSchema = z.strictObject({
  forestry: forestryInputSchema,
  timberPrices: timberPricesSchema,
  nominalDiscountRate: nonnegative,
  annualInflationRate: z.number().finite().gt(-1),
});
export type ForestryInput = z.infer<typeof forestryInputSchema>;
export type GrowthAssumptions = z.infer<typeof growthAssumptionsSchema>;
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
