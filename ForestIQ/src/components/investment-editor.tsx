'use client';
import { useState } from 'react';
import { z } from 'zod';
import { createSyntheticAnalysis } from '../data/synthetic-analysis';
import { analyzeInvestment } from '../domain/analysis/analyze';
import { type AnalysisInput } from '../domain/models/analysis';
import type { ForestProperty, ForestStand } from '../domain/models/property';
import { NumberField } from './number-field';
import { Results } from './results';
import { HarvestSchedule } from './harvest-schedule';
import { ScenarioComparison } from './scenario-comparison';
import { compareHarvestStrategies, type ScenarioProjection } from '../domain/analysis/scenarios';

const species = { pine: 'Mänty', spruce: 'Kuusi', birch: 'Koivu' } as const;
const labels: Record<string, string> = {
  askingPrice: 'Kauppahinta', name: 'Kiinteistön nimi', areaHa: 'Pinta-ala', totalAreaHa: 'Kokonaispinta-ala',
  transferTaxRate: 'Varainsiirtovero', otherAcquisitionCosts: 'Muut hankintakulut', annualManagementCosts: 'Hoitokulut',
  bareLandValuePerHa: 'Maapohjan arvo', nominalDiscountRate: 'Diskonttokorko', annualInflationRate: 'Inflaatio',
  ageYears: 'Ikä', merchantableVolumeM3PerHa: 'Puuston tilavuus', annualGrowthM3PerHa: 'Kasvuoletus',
  sawlogProportion: 'Tukkiosuus', earliestHarvestYear: 'Aikaisin hakkuuvuosi', costPerHa: 'Uudistamiskulu',
  establishmentDelayYears: 'Uudistamisviive', merchantableGrowthStartAgeYears: 'Kasvun alkamisikä',
  rampYears: 'Kasvun nousuaika', declineAgeYears: 'Kasvun hidastumisikä', oldAgeMultiplier: 'Vanhan puuston kasvukerroin',
  sawlogPerM3: 'Tukin hinta', pulpwoodPerM3: 'Kuitupuun hinta', year: 'Hakkuuvuosi',
};

function errorsFor(error: unknown): string[] {
  if (error instanceof z.ZodError) return error.issues.map(issue => {
    if (issue.code === 'custom') return issue.message;
    if (issue.path.at(-1) === 'removalProportion') return 'Harvennuksen poistuman on oltava yli 0 % ja alle 100 %. Käytä 100 % poistumaan päätehakkuuta.';
    const field = labels[String(issue.path.at(-1))] ?? 'Lähtötieto';
    const standIndex = issue.path.indexOf('stands');
    const prefix = standIndex >= 0 ? `Kuvio ${Number(issue.path[standIndex + 1]) + 1}: ` : '';
    return `${prefix}${field}: tarkista arvo. Käytä sallittua, äärellistä lukua; kokonaisluvut vaaditaan vuosille ja iälle. Negatiivinen arvo sallitaan vain inflaatiossa (yli −100 %).`;
  });
  return [error instanceof Error ? error.message : 'Laskenta epäonnistui. Tarkista lähtötiedot.'];
}

export function InvestmentEditor() {
  const [input, setInput] = useState<AnalysisInput>(() => createSyntheticAnalysis().data);
  const [edited, setEdited] = useState(false);
  const property = input.forestry.property;
  const change = (update: (draft: AnalysisInput) => void) => {
    setEdited(true);
    setInput(previous => { const draft = structuredClone(previous); update(draft); return draft; });
  };
  const updateProperty = <K extends keyof ForestProperty>(key: K, value: ForestProperty[K]) => change(draft => { draft.forestry.property[key] = value; });
  const updateStand = <K extends keyof ForestStand>(index: number, key: K, value: ForestStand[K]) => change(draft => {
    draft.forestry.property.stands[index]![key] = value;
    if (key === 'areaHa') draft.forestry.property.totalAreaHa = draft.forestry.property.stands.reduce((sum, stand) => sum + stand.areaHa, 0);
  });
  let result;
  let errors: string[] = [];
  try { result = analyzeInvestment(input); } catch (error) { errors = errorsFor(error); }
  let scenarios: ScenarioProjection[] = [];
  let comparisonError = false;
  try { scenarios = compareHarvestStrategies(input); } catch { comparisonError = true; }
  return <>
    <aside className="notice">{edited ? 'Muokattu esimerkkiskenaario: syötteet ovat käyttäjän oletuksia; muuttamattomat arvot ovat synteettisiä.' : 'Kaikki lähtöarvot ovat synteettisiä esimerkkejä, eivät mittauksia tai markkinahintoja.'} Tiedot eivät tallennu sivun uudelleenlatauksessa.</aside>
    <section aria-labelledby="property-heading"><h2 id="property-heading">Kiinteistö ja arvostusoletukset</h2>
      <p>Oletukset euroina tämän päivän hintatasossa. Prosentit syötetään prosentteina.</p>
      <div className="fields">
        <label className="field">Kiinteistön nimi<input value={property.name} onChange={e => updateProperty('name', e.target.value)} /></label>
        <NumberField label="Kauppahinta (€)" value={property.askingPrice} onChange={v => updateProperty('askingPrice', v)} />
        <NumberField label="Varainsiirtovero (%)" percent value={property.transferTaxRate} onChange={v => updateProperty('transferTaxRate', v)} />
        <NumberField label="Muut hankintakulut (€)" value={property.otherAcquisitionCosts} onChange={v => updateProperty('otherAcquisitionCosts', v)} />
        <NumberField label="Vuotuiset hoitokulut (€)" value={property.annualManagementCosts} onChange={v => updateProperty('annualManagementCosts', v)} />
        <NumberField label="Maapohjan arvo (€/ha)" value={property.bareLandValuePerHa} onChange={v => updateProperty('bareLandValuePerHa', v)} />
        <label className="field">Sijoitusaika (vuotta)<select value={property.holdingPeriodYears} onChange={e => updateProperty('holdingPeriodYears', Number(e.target.value) as ForestProperty['holdingPeriodYears'])}>{[5, 10, 20, 40].map(year => <option key={year}>{year}</option>)}</select></label>
        <NumberField label="Nimellinen diskonttokorko (%)" percent value={input.nominalDiscountRate} onChange={v => change(draft => { draft.nominalDiscountRate = v; })} />
        <NumberField label="Vuotuinen inflaatio (%)" percent value={input.annualInflationRate} onChange={v => change(draft => { draft.annualInflationRate = v; })} />
      </div>
      <p>Kokonaispinta-ala lasketaan kuvioista: {Number.isFinite(property.totalAreaHa) ? new Intl.NumberFormat('fi-FI').format(property.totalAreaHa) : '—'} ha.</p>
    </section>
    <section aria-labelledby="stands-heading"><h2 id="stands-heading">Kuviot ja oma hakkuuaikataulu</h2>
      <p>Muokkaa omaa aikataulua ja vertaa sitä alempana oletusstrategioihin. Päätehakkuu poistaa kaiken puuston kasvun jälkeen. Vuodet lasketaan hankinnasta, eivät kalenterivuosina. Sijoitusajan ulkopuolinen hakkuu on korjattava erikseen.</p>
      {property.stands.map((stand, index) => {
        return <fieldset key={stand.id}><legend>Kuvio {stand.id} · {species[stand.species]}</legend><div className="fields">
          <NumberField label="Pinta-ala (ha)" value={stand.areaHa} onChange={v => updateStand(index, 'areaHa', v)} />
          <label className="field">Puulaji<select value={stand.species} onChange={e => updateStand(index, 'species', e.target.value as ForestStand['species'])}>{Object.entries(species).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
          <label className="field">Kehitysluokka<select aria-label={`Kuvion ${stand.id} kehitysluokka`} value={stand.developmentClass} onChange={e => updateStand(index, 'developmentClass', e.target.value as ForestStand['developmentClass'])}><option value="seedling">Taimikko</option><option value="young">Nuori metsä</option><option value="maturing">Varttunut metsä</option><option value="mature">Uudistuskypsä metsä</option></select></label>
          <NumberField label="Ikä (vuotta)" integer value={stand.ageYears} onChange={v => updateStand(index, 'ageYears', v)} />
          <NumberField label="Puuston tilavuus (m³/ha)" value={stand.merchantableVolumeM3PerHa} onChange={v => updateStand(index, 'merchantableVolumeM3PerHa', v)} />
          <NumberField label="Tukkiosuus (%)" percent value={stand.sawlogProportion} onChange={v => updateStand(index, 'sawlogProportion', v)} />
          <NumberField label="Vuotuinen peruskasvu (m³/ha)" value={stand.annualGrowthM3PerHa} onChange={v => updateStand(index, 'annualGrowthM3PerHa', v)} />
          <NumberField label="Aikaisin hakkuuvuosi" integer value={stand.earliestHarvestYear} onChange={v => updateStand(index, 'earliestHarvestYear', v)} />
          <label className="field">Hakkuurajoitus<select value={stand.harvestRestriction} onChange={e => updateStand(index, 'harvestRestriction', e.target.value as ForestStand['harvestRestriction'])}><option value="none">Ei rajoitusta</option><option value="thinning-only">Vain harvennus</option><option value="no-harvest">Ei hakkuita</option></select></label>
          <HarvestSchedule stand={stand} events={input.forestry.harvests.filter(event => event.standId === stand.id)} onChange={events => change(draft => {
            draft.forestry.harvests = [...draft.forestry.harvests.filter(event => event.standId !== stand.id), ...events];
          })} />
          <NumberField label="Uudistamiskulu (€/ha)" value={stand.regeneration.costPerHa} onChange={v => updateStand(index, 'regeneration', { ...stand.regeneration, costPerHa: v })} />
          <NumberField label="Uudistamisviive (vuotta)" integer value={stand.regeneration.establishmentDelayYears} onChange={v => updateStand(index, 'regeneration', { ...stand.regeneration, establishmentDelayYears: v })} />
          <NumberField label="Ainespuun kasvun alkamisikä" integer value={stand.regeneration.merchantableGrowthStartAgeYears} onChange={v => updateStand(index, 'regeneration', { ...stand.regeneration, merchantableGrowthStartAgeYears: v })} />
        </div></fieldset>;
      })}
    </section>
    <section aria-labelledby="assumptions-heading"><h2 id="assumptions-heading">Kasvu- ja kantohintaoletukset</h2>
      <div className="fields">
        <NumberField label="Kasvun nousuaika (vuotta)" integer value={input.forestry.growth.rampYears} onChange={v => change(draft => { draft.forestry.growth.rampYears = v; })} />
        <NumberField label="Kasvun hidastumisikä (vuotta)" integer value={input.forestry.growth.declineAgeYears} onChange={v => change(draft => { draft.forestry.growth.declineAgeYears = v; })} />
        <NumberField label="Vanhan puuston kasvukerroin (%)" percent value={input.forestry.growth.oldAgeMultiplier} onChange={v => change(draft => { draft.forestry.growth.oldAgeMultiplier = v; })} />
        {Object.entries(species).map(([key, title]) => { const tree = key as ForestStand['species']; return <fieldset key={tree}><legend>{title} · hintaolettama</legend>
          <NumberField label={`${title}: tukki (€/m³)`} value={input.timberPrices[tree].sawlogPerM3} onChange={v => change(draft => { draft.timberPrices[tree].sawlogPerM3 = v; })} />
          <NumberField label={`${title}: kuitupuu (€/m³)`} value={input.timberPrices[tree].pulpwoodPerM3} onChange={v => change(draft => { draft.timberPrices[tree].pulpwoodPerM3 = v; })} />
        </fieldset>; })}
      </div>
      <details><summary>Laskennan oletukset ja rajaukset</summary>
        <p>Kasvu määräytyy vuoden alun iästä: alkamisikään asti 0, sen jälkeen lineaarinen nousu peruskasvuun nousuajan kuluessa. Hidastumisiästä alkaen kasvu kerrotaan vanhan puuston kertoimella. Uudistamisviiveen aikana ikä ja kasvu pysyvät nollassa. Uudistunut tukkiosuus nousee samalla ikärampilla alkuperäiseen tukkiosuuteen.</p>
        <p>Uudistamiskulu maksetaan hakkuuvuonna. Inflaatio kasvattaa hintoja, hoito- ja uudistamiskuluja sekä maapohjan arvoa vuodesta 1 alkaen. Kaikki kassavirrat syntyvät vuoden lopussa; hankinta on hetkellä 0.</p>
        <p>Kasvu ei ole tieteellisesti validoitu ennuste. Kasvupaikkaluokkaa ja uudistamismenetelmää ei käytetä erillisinä kasvukertoimina. Malli sallii harvennuksia ennen yhtä päätehakkuuta kuviota kohti. Harvennus poistaa saman osuuden tukista ja kuidusta. Se ei muuta ikää, tukkiosuutta tai tulevan kasvun oletusta eikä aiheuta uudistamiskulua. Kasvu ei reagoi puuston tiheyteen: suurten poistumien jälkeinen kasvu voi siksi yliarvioitua.</p>
      </details>
    </section>
    <aside className="notice">Jäännösarvo on yksinkertaistettu arvio: maa + jäljellä oleva ainespuusto kantohinnoin. Menetelmä voi aliarvioida nuoria metsiä ja taimikoita. Tämä ei ole summa-arvomenetelmä tai kauppa-arvio. Laskelmat ovat ennen tuloveroja, ilman rahoitusta; ne eivät ole sijoitussuosituksia.</aside>
    {errors.length > 0 ? <section role="alert" className="error"><h2>Tuloksia ei voida laskea</h2><ul>{errors.map((message, index) => <li key={index}>{message}</li>)}</ul><p>Korjaa lähtötiedot. Aiemmat tulokset on piilotettu.</p></section> : result && <Results result={result} />}
    {comparisonError && <p role="status">Skenaariovertailua ei voida laskea. Tarkista yhteiset lähtötiedot.</p>}
    {scenarios.length > 0 && <ScenarioComparison scenarios={scenarios} manual={result} onApply={harvests => change(draft => { draft.forestry.harvests = harvests; })} />}
  </>;
}
