import { Component, type ErrorInfo, type ReactNode } from 'react';

import { TriangleAlert } from 'lucide-react';

import { captureException } from './client';

import styles from './AnalyticsErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it, reports them to PostHog error
 * tracking, and shows a recoverable fallback instead of a blank screen.
 */
export class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, {
      react_component_stack: info.componentStack,
      source: 'react_error_boundary',
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback !== undefined ? this.props.fallback : <ErrorFallback />;
  }
}

function ErrorFallback() {
  return (
    <div className={styles.fallback} role="alert">
      <TriangleAlert className={styles.icon} aria-hidden="true" />
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.message}>
        This page hit an unexpected error. Reloading usually fixes it.
      </p>
      <button type="button" className={styles.button} onClick={() => window.location.reload()}>
        Reload page
      </button>
    </div>
  );
}
