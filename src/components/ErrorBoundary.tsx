import { Component, ErrorInfo, ReactNode } from 'react';
import { logSecurityEvent } from '../utils/security';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Daymark Exception Caught by ErrorBoundary:', error, errorInfo);
    logSecurityEvent('Runtime Render Error', error.message || 'Unknown render exception', 'error');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = 'today';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary-container">
          <div className="app-error-card">
            <div className="error-badge">SYSTEM RECOVERY MODE</div>
            <h2>An Unexpected Display State Occurred</h2>
            <p className="error-desc">
              Daymark recovered gracefully from a runtime exception to preserve your local data integrity. Your notes and tasks remain securely saved offline.
            </p>
            {this.state.error && (
              <pre className="error-trace-box">{this.state.error.toString()}</pre>
            )}
            <div className="error-actions">
              <button type="button" className="primary-button" onClick={this.handleReset}>
                Reload Application Workspace
              </button>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = 'today';
                }}
              >
                Return to Today's Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
