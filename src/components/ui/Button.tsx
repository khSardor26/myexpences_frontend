import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'danger';

const base =
  'inline-flex min-h-tap items-center justify-center gap-2 rounded-control px-3 font-normal transition-colors';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-accent-hover hover:text-white',
  secondary: 'border border-control bg-transparent text-ink hover:bg-primary-soft',
  danger: 'bg-danger text-on-primary hover:opacity-90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
}

export function LinkButton({ variant = 'primary', className = '', ...props }: LinkButtonProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
