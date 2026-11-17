import { z } from 'zod';

export const nonnegative = z.number().finite().nonnegative();
export const positive = z.number().finite().positive();
export const fraction = z.number().finite().min(0).max(1);
export const year = z.number().int().min(1);
export const speciesSchema = z.enum(['pine', 'spruce', 'birch']);
export const developmentClassSchema = z.enum(['seedling', 'young', 'maturing', 'mature']);

export const standSchema = z.strictObject({
  id: z.string().trim().min(1),
  areaHa: positive,
  species: speciesSchema,
  ageYears: z.number().int().nonnegative(),
  merchantableVolumeM3PerHa: nonnegative,
  sawlogProportion: fraction,
  annualGrowthM3PerHa: nonnegative,
  earliestHarvestYear: year,
  harvestRestriction: z.enum(['none', 'thinning-only', 'no-harvest']),
  developmentClass: developmentClassSchema,
  siteQuality: z.enum(['fertile', 'medium', 'poor']),
  regeneration: z.strictObject({
    costPerHa: nonnegative,
    method: z.enum(['planting', 'seeding', 'natural']),
    establishmentDelayYears: z.number().int().nonnegative(),
    merchantableGrowthStartAgeYears: z.number().int().min(1),
  }),
});

export const propertySchema = z.strictObject({
  name: z.string().trim().min(1),
  askingPrice: nonnegative,
  totalAreaHa: positive,
  transferTaxRate: fraction.default(0.03),
  otherAcquisitionCosts: nonnegative,
  annualManagementCosts: nonnegative,
  bareLandValuePerHa: nonnegative,
  holdingPeriodYears: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(40)]),
  stands: z.array(standSchema).min(1),
}).superRefine((property, context) => {
  const ids = new Set<string>();
  property.stands.forEach((stand, index) => {
    if (ids.has(stand.id)) context.addIssue({ code: 'custom', path: ['stands', index, 'id'], message: 'Kuvion tunnisteen on oltava yksilöllinen.' });
    ids.add(stand.id);
  });
  const area = property.stands.reduce((sum, stand) => sum + stand.areaHa, 0);
  if (Math.abs(area - property.totalAreaHa) > 1e-6) {
    context.addIssue({ code: 'custom', path: ['totalAreaHa'], message: 'Kuvioiden pinta-alojen summan on vastattava kokonaispinta-alaa.' });
  }
});

export type ForestStand = z.infer<typeof standSchema>;
export type ForestProperty = z.infer<typeof propertySchema>;
export type TreeSpecies = z.infer<typeof speciesSchema>;
