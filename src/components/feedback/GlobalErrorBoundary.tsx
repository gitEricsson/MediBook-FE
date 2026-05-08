import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MB } from '@/constants/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // In production, send this to Sentry or similar
  }

  public render() {
    if (this.state.hasError) {
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
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 overflow-auto rounded bg-white p-4 text-left text-xs text-red-600">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
