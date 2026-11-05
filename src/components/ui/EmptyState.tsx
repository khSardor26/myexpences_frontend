import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon aria-hidden className="size-6 text-muted" />
      <h2 className="font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
