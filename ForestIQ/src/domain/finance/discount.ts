/** Array index is the end-year period; index zero is time zero. */
export function npv(rate: number, cashFlows: readonly number[]): number {
  if (!Number.isFinite(rate) || rate <= -1 || cashFlows.some(value => !Number.isFinite(value))) {
    throw new RangeError('Diskonttokorko tai kassavirta on virheellinen.');
  }
  const result = cashFlows.reduce((sum, value, year) => sum + value / (1 + rate) ** year, 0);
  if (!Number.isFinite(result)) throw new RangeError('Nykyarvolaskennan arvot ovat liian suuria.');
  return result;
}
