import type { ScenarioProjection } from '../domain/analysis/scenarios';
import type { InvestmentAnalysis } from '../domain/analysis/analyze';
import type { HarvestEvent } from '../domain/models/analysis';

const names = { early: 'A · Aikainen', delayed: 'B · Viivästetty', staggered: 'C · Porrastettu' };
const euro = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export function ScenarioComparison({ scenarios, manual, onApply }: {
  scenarios: ScenarioProjection[]; manual?: InvestmentAnalysis; onApply: (events: HarvestEvent[]) => void;
}) {
  const columns = [{ id: 'manual', name: 'Oma aikataulu', result: manual }, ...scenarios.map(scenario => ({
    id: scenario.id, name: names[scenario.id], result: scenario.status === 'available' ? scenario.result : undefined,
  }))];
  const years = columns.find(column => column.result)?.result?.annual.map(row => row.year) ?? [];
  return <section aria-labelledby="comparison-heading">
    <h2 id="comparison-heading">Skenaariovertailu</h2>
    <p>Kaikilla skenaarioilla on sama alkupuusto ja samat talousoletukset. Tämä on ajoitusvertailu, ei optimaalisen metsänhoidon laskenta.</p>
    <p>Oletusstrategiat päätehakkaavat varttuneet ja uudistuskypsät kuviot käsin annetun hakkuukelpoisuuden mukaan: A aikaisimpana sallittuna vuonna, B viisi vuotta myöhemmin, C lisää järjestyksessä 0, 5, 10… vuotta. Järjestys on hakkuukelpoisuusvuosi ja kuvion tunniste. Luokitus ei korvaa maastossa arvioitua hakkuukelpoisuutta.</p>
    {scenarios.map(scenario => <div key={scenario.id} className="my-4 border-t border-stone-300 pt-3" data-testid={`strategy-${scenario.id}`}>
      <h3 className="font-semibold">{names[scenario.id]}</h3>
      <p>{scenario.harvests.length ? scenario.harvests.map(event => `${event.standId}: päätehakkuu vuonna ${event.year}`).join('; ') : 'Ei suunniteltuja hakkuita.'}</p>
      {scenario.exclusions.map(exclusion => <p className="text-sm" key={exclusion.standId}>Kuvio {exclusion.standId} jätetään oletusstrategian ulkopuolelle: {exclusion.reason === 'restriction' ? 'hakkuurajoitus' : 'nuori metsä tai taimikko'}. Muokkaa tarvittaessa omaa aikataulua.</p>)}
      {scenario.status === 'unavailable' ? <p className="text-red-800">Ei laskettavissa: {scenario.errors.join(' ')}</p> : <button type="button" onClick={() => onApply(structuredClone(scenario.harvests))}>Kopioi {names[scenario.id]} omaan aikatauluun</button>}
    </div>)}
    <div className="table-scroll" role="region" aria-label="Skenaarioiden yhteenveto" tabIndex={0}>
      <table><caption>Skenaarioiden tuottoarvo ja NPV (€)</caption><thead><tr><th scope="col">Tunnusluku</th>{columns.map(column => <th scope="col" key={column.id}>{column.name}</th>)}</tr></thead>
        <tbody>{(['incomeValue', 'projectNpv'] as const).map(key => <tr key={key}><th scope="row">{key === 'incomeValue' ? 'Tuottoarvo' : 'NPV'}</th>{columns.map(column => <td key={column.id}>{column.result ? euro.format(column.result[key]) : 'Ei laskettavissa'}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <div className="table-scroll" role="region" aria-label="Skenaarioiden vuotuinen vertailu" tabIndex={0}>
      <table><caption>Vuotuinen kassavirta ja jäljellä oleva metsän arvo (€)</caption><thead><tr><th scope="col">Vuosi / tunnusluku</th>{columns.map(column => <th scope="col" key={column.id}>{column.name}</th>)}</tr></thead><tbody>
        <tr><th scope="row">0 · Hankinta</th>{columns.map(column => <td key={column.id}>{column.result ? euro.format(-column.result.acquisition.total) : '—'}</td>)}</tr>
        {years.map((year, index) => <tr key={year}><th scope="row">{year} · Kassavirta / metsän arvo</th>{columns.map(column => { const row = column.result?.annual[index]; return <td key={column.id}>{row ? `${euro.format(row.cashFlow)} / ${euro.format(row.remainingValue.total)}` : 'Ei laskettavissa'}</td>; })}</tr>)}
      </tbody></table>
    </div>
    <p>Viimeisen vuoden kassavirta sisältää myyntitulon kerran. Metsän arvo on erillinen tilannearvio, eikä sitä lisätä muiden vuosien kassavirtaan. Oman aikataulun muokkaus ei muuta oletusstrategioita.</p>
  </section>;
}
