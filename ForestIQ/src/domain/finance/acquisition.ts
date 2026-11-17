import type { ForestProperty } from '../models/property';
export function acquisitionCosts(property: Pick<ForestProperty, 'askingPrice' | 'transferTaxRate' | 'otherAcquisitionCosts'>) {
  const transferTax = property.askingPrice * property.transferTaxRate;
  return { purchasePrice: property.askingPrice, transferTax, otherCosts: property.otherAcquisitionCosts,
    total: property.askingPrice + transferTax + property.otherAcquisitionCosts };
}
