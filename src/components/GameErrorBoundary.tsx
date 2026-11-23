import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface GameErrorBoundaryProps {
  children: React.ReactNode;
  onReturnHome?: () => void;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering or asset error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#060810] flex items-center justify-center p-6 text-stone-100">
          <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-stone-950 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-serif font-bold text-white">Unable to Load Game Scene</h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                {this.state.errorMessage}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
              {this.props.onReturnHome && (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ hasError: false, errorMessage: '' });
                    this.props.onReturnHome?.();
                  }}
                  className="px-4 py-2.5 rounded-lg border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Main Website</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
