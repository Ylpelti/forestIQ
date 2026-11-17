import { forestryInputSchema, type ForestryInput, type GrowthAssumptions } from '../models/analysis';

export interface StandYear {
  standId: string;
  year: number;
  openingAgeYears: number;
  closingAgeYears: number;
  openingVolumeM3: number;
  growthM3: number;
  harvestedVolumeM3: number;
  closingVolumeM3: number;
  harvestedSawlogProportion: number;
  closingSawlogProportion: number;
  regenerationCost: number;
}

/** Opening-age ramp followed by a configurable old-age reduction; not calibrated. */
export function growthMultiplier(age: number, startAge: number, assumptions: GrowthAssumptions): number {
  const ramp = Math.min(1, Math.max(0, (age - startAge) / assumptions.rampYears));
  return ramp * (age >= assumptions.declineAgeYears ? assumptions.oldAgeMultiplier : 1);
}

export function projectForest(raw: ForestryInput): StandYear[] {
  const { property, growth, harvests } = forestryInputSchema.parse(raw);
  return property.stands.flatMap(stand => {
    let volume = stand.areaHa * stand.merchantableVolumeM3PerHa;
    let age = stand.ageYears;
    let delay = 0;
    let regenerated = false;
    const rows: StandYear[] = [];
    const schedule = harvests.filter(event => event.standId === stand.id);
    const sawlogShare = (currentAge: number) => regenerated
      ? stand.sawlogProportion * Math.min(1, Math.max(0, (currentAge - stand.regeneration.merchantableGrowthStartAgeYears) / growth.rampYears))
      : stand.sawlogProportion;
    for (let year = 1; year <= property.holdingPeriodYears; year++) {
      const openingVolumeM3 = volume;
      const openingAgeYears = age;
      const growthM3 = delay > 0 ? 0 : stand.areaHa * stand.annualGrowthM3PerHa
        * growthMultiplier(age, stand.regeneration.merchantableGrowthStartAgeYears, growth);
      if (delay > 0) delay--;
      else age++;
      const available = openingVolumeM3 + growthM3;
      const harvestedSawlogProportion = sawlogShare(age);
      const harvest = schedule.find(event => event.year === year);
      const isFinal = harvest?.type === 'final';
      const harvestedVolumeM3 = isFinal ? available : harvest?.type === 'thinning' ? available * harvest.removalProportion : 0;
      volume = available - harvestedVolumeM3;
      if (!Number.isFinite(volume) || !Number.isFinite(harvestedVolumeM3)) throw new RangeError('Puustolaskennan arvot ovat liian suuria.');
      if (isFinal) {
        age = 0;
        delay = stand.regeneration.establishmentDelayYears;
        regenerated = true;
      }
      rows.push({ standId: stand.id, year, openingAgeYears, closingAgeYears: age,
        openingVolumeM3, growthM3, harvestedVolumeM3, closingVolumeM3: volume,
        harvestedSawlogProportion, closingSawlogProportion: sawlogShare(age),
        regenerationCost: isFinal ? stand.areaHa * stand.regeneration.costPerHa : 0 });
    }
    return rows;
  });
}
