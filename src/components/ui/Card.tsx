import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** No inner padding, for lists whose rows and dividers reach the card's edges. */
  flush?: boolean;
}

export function Card({ flush = false, className = '', ...props }: CardProps) {
  const padding = flush ? 'overflow-hidden' : 'p-4';
  return <div className={`rounded-card border border-line bg-surface ${padding} ${className}`} {...props} />;
}
