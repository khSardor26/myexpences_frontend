interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

/** A row of joined buttons for choosing one of a few options. */
export function Segmented<T extends string>({ label, options, value, disabled, onChange }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex divide-x divide-control overflow-hidden rounded-control border border-control"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`min-h-tap px-4 -outline-offset-2 ${
              selected ? 'bg-accent-soft font-medium text-on-accent-soft' : 'text-ink hover:bg-primary-soft'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
