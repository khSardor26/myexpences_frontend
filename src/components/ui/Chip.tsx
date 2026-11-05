import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Leave undefined for a chip that performs an action rather than being chosen. */
  selected?: boolean;
}

export function Chip({ selected, className = '', children, ...props }: ChipProps) {
  const look = selected
    ? 'border-accent bg-accent-soft text-on-accent-soft font-medium'
    : 'border-control text-ink hover:bg-primary-soft';

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-tap items-center gap-1.5 rounded-control border px-3 ${look} ${className}`}
      {...props}
    >
      {selected && <Check aria-hidden className="size-4 shrink-0" />}
      {children}
    </button>
  );
}
