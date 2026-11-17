import { analysisInputSchema, type AnalysisInput } from '../models/analysis';
import { projectForest } from '../forestry/project';
import { acquisitionCosts } from '../finance/acquisition';
import { npv } from '../finance/discount';
import { residualValue, timberValue } from '../valuation/residual';
import { incomeValue } from '../valuation/income';

export function analyzeInvestment(raw: AnalysisInput) {
  const input = analysisInputSchema.parse(raw);
  const { property } = input.forestry;
  const standYears = projectForest(input.forestry);
  const acquisition = acquisitionCosts(property);
  const annual = Array.from({ length: property.holdingPeriodYears }, (_, index) => {
    const year = index + 1;
    const factor = (1 + input.annualInflationRate) ** year;
    const stands = standYears.filter(row => row.year === year);
    const harvestRevenue = stands.reduce((sum, row) => {
      const stand = property.stands.find(stand => stand.id === row.standId)!;
      return sum + timberValue(row.harvestedVolumeM3, row.harvestedSawlogProportion, stand.species, input.timberPrices) * factor;
    }, 0);
    const regenerationCost = stands.reduce((sum, row) => sum + row.regenerationCost * factor, 0);
    const managementCost = property.annualManagementCosts * factor;
    const operatingCashFlow = harvestRevenue - regenerationCost - managementCost;
    const remainingValue = residualValue(property, stands, input.timberPrices, factor);
    const exitProceeds = year === property.holdingPeriodYears ? remainingValue.total : 0;
    const cashFlow = operatingCashFlow + exitProceeds;
    if (![harvestRevenue, regenerationCost, managementCost, remainingValue.total, cashFlow].every(Number.isFinite)) {
      throw new RangeError('Laskennan arvot ovat liian suuria. Pienennä lähtöarvoja.');
    }
    return { year, harvestRevenue, regenerationCost, managementCost, operatingCashFlow, remainingValue, exitProceeds, cashFlow };
  });
  const terminalValue = annual[annual.length - 1]!.remainingValue;
  const cashFlows = [-acquisition.total, ...annual.map(row => row.cashFlow)];
  return { acquisition, standYears, annual, terminalValue, cashFlows,
    incomeValue: incomeValue(annual.map(row => row.operatingCashFlow), terminalValue.total, input.nominalDiscountRate),
    projectNpv: npv(input.nominalDiscountRate, cashFlows) };
}
export type InvestmentAnalysis = ReturnType<typeof analyzeInvestment>;
