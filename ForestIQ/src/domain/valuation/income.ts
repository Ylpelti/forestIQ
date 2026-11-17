import { npv } from '../finance/discount';

/** Property value excludes acquisition. Residual is supplied independently. */
export function incomeValue(annualOperatingCashFlows: readonly number[], terminalAssetValue: number, rate: number): number {
  if (annualOperatingCashFlows.length === 0) throw new Error('Tuottoarvo edellyttää vähintään yhtä vuotta.');
  return npv(rate, [0, ...annualOperatingCashFlows])
    + npv(rate, [...Array<number>(annualOperatingCashFlows.length).fill(0), terminalAssetValue]);
}
