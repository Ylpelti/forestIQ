import { propertySchema, type ForestProperty } from '../models/property';
import type { HarvestEvent } from '../models/analysis';

export type StrategyId = 'early' | 'delayed' | 'staggered';
export interface HarvestStrategy {
  id: StrategyId;
  harvests: HarvestEvent[];
  exclusions: { standId: string; reason: 'restriction' | 'development-class' }[];
}

/** Manual eligibility is authoritative; these are timing heuristics, not optimization. */
export function generateHarvestStrategies(raw: ForestProperty): HarvestStrategy[] {
  const property = propertySchema.parse(raw);
  const candidates = property.stands.filter(stand => stand.harvestRestriction === 'none'
    && (stand.developmentClass === 'mature' || stand.developmentClass === 'maturing'))
    .sort((a, b) => a.earliestHarvestYear - b.earliestHarvestYear || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const exclusions: HarvestStrategy['exclusions'] = property.stands.filter(stand => !candidates.some(candidate => candidate.id === stand.id))
    .map(stand => ({ standId: stand.id, reason: stand.harvestRestriction !== 'none' ? 'restriction' : 'development-class' }));
  return (['early', 'delayed', 'staggered'] as const).map(id => ({
    id,
    // Keep out-of-horizon events: validation must report them, never clamp or discard.
    harvests: candidates.map((stand, index) => ({ standId: stand.id, type: 'final',
      year: stand.earliestHarvestYear + (id === 'delayed' ? 5 : id === 'staggered' ? index * 5 : 0) })),
    exclusions: exclusions.map(exclusion => ({ ...exclusion })),
  }));
}
