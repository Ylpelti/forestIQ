'use client';
import { useId } from 'react';

export function NumberField({ label, value, onChange, percent = false, integer = false }: {
  label: string; value: number; onChange: (value: number) => void; percent?: boolean; integer?: boolean;
}) {
  const id = useId();
  const displayed = percent ? value * 100 : value;
  return <label htmlFor={id} className="field">{label}
    <input id={id} type="number" step={integer ? '1' : 'any'} value={Number.isFinite(displayed) ? displayed : ''}
      onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value) / (percent ? 100 : 1))} />
  </label>;
}
