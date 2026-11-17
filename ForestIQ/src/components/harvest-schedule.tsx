'use client';
import type { HarvestEvent } from '../domain/models/analysis';
import type { ForestStand } from '../domain/models/property';
import { NumberField } from './number-field';

export function HarvestSchedule({ stand, events, onChange }: {
  stand: ForestStand; events: HarvestEvent[]; onChange: (events: HarvestEvent[]) => void;
}) {
  const rows: (HarvestEvent | undefined)[] = events.length ? events : [undefined];
  const replace = (index: number, event: HarvestEvent | undefined) => {
    const next = events.slice();
    if (event) next[index] = event;
    else next.splice(index, 1);
    onChange(next);
  };
  return <div className="col-span-full">
    {rows.map((event, index) => {
      const suffix = index === 0 ? '' : ` ${index + 1}`;
      return <div className="fields" key={index}>
        <label className="field">Hakkuu {index + 1}<select aria-label={`Kuvion ${stand.id} hakkuu${suffix}`} value={event?.type ?? 'none'} onChange={e => {
          const type = e.target.value;
          const common = { standId: stand.id, year: event?.year ?? stand.earliestHarvestYear };
          replace(index, type === 'none' ? undefined : type === 'thinning'
            ? { ...common, type, removalProportion: event?.type === 'thinning' ? event.removalProportion : 0.3 }
            : { ...common, type: 'final' });
        }}><option value="none">Ei hakkuuta / poista tapahtuma</option><option value="thinning">Harvennus</option><option value="final">Päätehakkuu</option></select></label>
        {event && <NumberField label={`Kuvion ${stand.id} hakkuuvuosi${suffix}`} integer value={event.year} onChange={year => replace(index, { ...event, year })} />}
        {event?.type === 'thinning' && <NumberField label={`Kuvion ${stand.id} poistuma (%)${suffix}`} percent value={event.removalProportion} onChange={removalProportion => replace(index, { ...event, removalProportion })} />}
      </div>;
    })}
    <button type="button" onClick={() => onChange([...events, { standId: stand.id, year: events.length ? events[events.length - 1]!.year + 1 : stand.earliestHarvestYear, type: 'thinning', removalProportion: 0.3 }])}>Lisää hakkuu kuviolle {stand.id}</button>
    <p className="text-sm">Harvennuksen poistuma: yli 0 % ja alle 100 % vuoden käytettävissä olevasta puustosta. Uuden harvennuksen 30 % on synteettinen oletus. Muokkaa ajoitusta; päällekkäiset tai päätehakkuun jälkeiset tapahtumat hylätään.</p>
  </div>;
}
