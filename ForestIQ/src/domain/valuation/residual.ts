import type { ForestProperty, TreeSpecies } from '../models/property';
import type { TimberPrices } from '../models/valuation';
import type { StandYear } from '../forestry/project';

export function timberValue(volumeM3: number, sawlogShare: number, species: TreeSpecies, prices: TimberPrices): number {
  const price = prices[species];
  return volumeM3 * (sawlogShare * price.sawlogPerM3 + (1 - sawlogShare) * price.pulpwoodPerM3);
}

/** Independent closing-inventory estimate; no income value or purchase price input. */
export function residualValue(property: Pick<ForestProperty, 'stands' | 'totalAreaHa' | 'bareLandValuePerHa'>,
  closingStands: readonly StandYear[], prices: TimberPrices, nominalFactor: number) {
  if (closingStands.length !== property.stands.length || new Set(closingStands.map(s => s.standId)).size !== property.stands.length) {
    throw new Error('Jäännösarvosta puuttuu kuvioita tai kuvioita on kahdesti.');
  }
  const land = property.totalAreaHa * property.bareLandValuePerHa * nominalFactor;
  const timber = property.stands.reduce((sum, stand) => {
    const row = closingStands.find(row => row.standId === stand.id);
    if (!row) throw new Error('Jäännösarvon kuvio puuttuu.');
    return sum + timberValue(row.closingVolumeM3, row.closingSawlogProportion, stand.species, prices) * nominalFactor;
  }, 0);
  return { land, timber, total: land + timber };
}
