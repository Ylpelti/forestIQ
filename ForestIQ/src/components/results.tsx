import type { InvestmentAnalysis } from '../domain/analysis/analyze';
const euro = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const volume = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });

export function Results({ result }: { result: InvestmentAnalysis }) {
  return <section aria-labelledby="results-heading">
    <h2 id="results-heading">Sijoitusanalyysi ilman rahoitusta</h2>
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 my-6">
      {[
        ['Hankintameno yhteensä', result.acquisition.total],
        ['Tuottoarvo', result.incomeValue],
        ['Projektin nettonykyarvo (NPV)', result.projectNpv],
        ['Jäännösarvo myyntivuonna', result.terminalValue.total],
      ].map(([label, value]) => <div key={label} className="border-t border-stone-300 pt-3"><dt>{label}</dt><dd className="text-2xl font-semibold mt-2" data-testid={label === 'Projektin nettonykyarvo (NPV)' ? 'npv' : undefined}>{euro.format(value as number)}</dd></div>)}
    </dl>
    <p>Hankintameno: kauppahinta {euro.format(result.acquisition.purchasePrice)}, varainsiirtovero {euro.format(result.acquisition.transferTax)} ja muut kulut {euro.format(result.acquisition.otherCosts)}.</p>
    <p>Tuottoarvo on tulevien nettotuottojen ja jäännösarvon nykyarvo. Projektin NPV = tuottoarvo − hankintameno. Kauppahinta ei muuta tuottoarvoa.</p>
    <p>Myyntivuoden jäännösarvo: maa {euro.format(result.terminalValue.land)} + jäljellä oleva puusto {euro.format(result.terminalValue.timber)}. Arvo lisätään kassavirtaan vain viimeisenä vuonna.</p>
    <div className="table-scroll" role="region" aria-label="Vuotuiset kassavirrat, vieritä vaakasuunnassa" tabIndex={0}>
      <table><caption>Vuotuiset kassavirrat ennen tuloveroja ja rahoitusta (€)</caption><thead><tr>{['Vuosi', 'Hakkuutulot', 'Uudistaminen', 'Hoito', 'Nettotuotto', 'Metsän arvo', 'Myyntitulo', 'Kassavirta'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
        <tbody><tr><th scope="row">0</th><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>{euro.format(-result.acquisition.total)}</td></tr>
          {result.annual.map(row => <tr key={row.year}><th scope="row">{row.year}</th>{[row.harvestRevenue, -row.regenerationCost, -row.managementCost, row.operatingCashFlow, row.remainingValue.total, row.exitProceeds, row.cashFlow].map((value, index) => <td key={index}>{euro.format(value)}</td>)}</tr>)}
        </tbody></table>
    </div>
    <details className="my-6"><summary>Puuston vuosittainen taselaskelma kuvioittain</summary>
      <div className="table-scroll" role="region" aria-label="Puustotase, vieritä vaakasuunnassa" tabIndex={0}>
        <table><caption>Alkupuusto + kasvu − hakkuu = loppupuusto (m³)</caption><thead><tr>{['Kuvio', 'Vuosi', 'Alkuikä', 'Loppuikä', 'Alkupuusto', 'Kasvu', 'Hakkuu', 'Loppupuusto'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
          <tbody>{result.standYears.map(row => <tr key={`${row.standId}-${row.year}`}><th scope="row">{row.standId}</th>{[row.year, row.openingAgeYears, row.closingAgeYears, row.openingVolumeM3, row.growthM3, row.harvestedVolumeM3, row.closingVolumeM3].map((value, index) => <td key={index}>{volume.format(value)}</td>)}</tr>)}</tbody></table>
      </div>
    </details>
  </section>;
}
