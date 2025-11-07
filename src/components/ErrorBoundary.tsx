import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#171717] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#262626] border border-[#2F2F2F] rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">
              Something went wrong
            </h1>
            
            <p className="text-[#A3A3A3] mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#9E7FFF]/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>

            <p className="text-xs text-[#A3A3A3] mt-4">
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
