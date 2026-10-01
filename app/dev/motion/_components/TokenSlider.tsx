"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function TokenSlider({ label, value, min, max, step, unit = "", onChange }: Props) {
  const id = useId();
  return (
    <div className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-2 text-xs">
      <label htmlFor={id} className="font-mono">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary"
      />
      <output htmlFor={id} className="text-right font-mono tabular-nums">
        {value}
        {unit}
      </output>
    </div>
  );
}
