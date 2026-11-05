import { TriangleAlert } from 'lucide-react';
import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { en } from '@/i18n/en';

interface ErrorBoundaryState {
  crashed: boolean;
}

/** If a screen hits an unexpected error, show a way out rather than a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { crashed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { crashed: true };
  }

  render() {
    if (!this.state.crashed) return this.props.children;

    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
        <EmptyState
          icon={TriangleAlert}
          title={en.errors.crashTitle}
          body={en.errors.crashBody}
          action={<Button onClick={() => window.location.reload()}>{en.errors.reload}</Button>}
        />
      </main>
    );
  }
}
