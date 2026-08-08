import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * React Error Boundary component to catch unhandled errors.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module') || 
                           this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-[#080C14] rounded-xl border border-slate-200 dark:border-white/10">
          <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            {isChunkError ? 'New Update Available' : 'System Malfunction'}
          </h2>
          <p className="text-slate-600 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
            {isChunkError
              ? 'SiteProof has been updated or your application bundle cache needs a refresh. Reloading will fetch the latest version.'
              : (this.state.error?.message || 'An unexpected error occurred while rendering the application. We have been notified of this issue.')}
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                sessionStorage.removeItem('page_refreshed_for_chunk_error');
                window.location.reload(true);
              }} 
              className="px-6 py-2.5 rounded-xl bg-[#00F5A0] text-slate-950 hover:bg-[#00E093] transition-all font-bold shadow-[0_0_20px_rgba(0,245,160,0.2)] cursor-pointer"
            >
              Reload Page
            </button>
            {!isChunkError && (
              <button 
                onClick={this.handleReset} 
                className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all font-semibold cursor-pointer"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
