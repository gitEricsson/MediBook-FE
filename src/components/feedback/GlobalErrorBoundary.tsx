import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MB } from '@/constants/tokens';
import { env } from '@/config/env';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error details for dev mode only
    this.setState({ errorInfo });
    // In production, send this to Sentry or similar error tracking service
    if (env.VITE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('[PRODUCTION ERROR]', error, errorInfo);
    } else {
      console.error('[DEV ERROR]', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      const isDev = env.VITE_ENV === 'development';

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
             style={{ backgroundColor: MB.bg2 }}>
          <h1 className="mb-4 text-2xl font-bold" style={{ color: MB.ink }}>
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md" style={{ color: MB.text2 }}>
            We've encountered an unexpected error. Our team has been notified.
            Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md px-6 py-2 font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: MB.primary }}
          >
            Refresh Page
          </button>
          {/* Only show raw error details in development mode */}
          {isDev && this.state.error && (
            <pre className="mt-8 overflow-auto rounded bg-white p-4 text-left text-xs text-red-600 max-w-2xl">
              {this.state.error.toString()}
              {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
