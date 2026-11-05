import { useId, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function SelectField({ label, className = '', children, ...props }: SelectFieldProps) {
  const id = useId();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        className={`min-h-tap w-full rounded-control border border-control bg-surface px-2 text-ink ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
