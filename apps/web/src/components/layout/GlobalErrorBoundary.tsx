"use client";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-brand-black flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h1>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="glow-button px-6 py-3"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
