import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BreachPoint Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090F] text-[#D5DBE7] font-mono flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full border border-[#E84D7E]/40 bg-[#0E1220] p-6 shadow-[0_0_30px_rgba(232,77,126,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E84D7E] to-transparent" />
            <div className="text-[10px] tracking-[0.3em] text-[#E84D7E] uppercase font-bold mb-2">
              [ SYSTEM CRITICAL FAULT ]
            </div>
            <h1 className="text-xl text-[#F2F5FB] font-mono font-bold tracking-wider mb-3">
              TERMINAL RENDER EXCEPTION
            </h1>
            <p className="text-[12px] text-[#8B93A9] leading-relaxed mb-4">
              An unexpected anomaly disrupted the uplink display pipeline.
            </p>
            {this.state.error && (
              <div className="text-left bg-[#05070B] border border-[#1E2536] p-3 mb-6 overflow-x-auto text-[11px] text-[#E84D7E] font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 border border-[#5ED6E3] text-[#5ED6E3] hover:bg-[#5ED6E3]/10 text-[11px] tracking-widest uppercase transition-all cursor-pointer"
              >
                RECONNECT →
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 border border-[#1E2536] text-[#8B93A9] hover:text-[#D5DBE7] hover:border-[#5A6379] text-[11px] tracking-widest uppercase transition-all cursor-pointer"
              >
                RESET SESSION
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
