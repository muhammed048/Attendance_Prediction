export default function ErrorBanner({ message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg bg-risk-high/10 border border-risk-high/30 text-risk-high ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <svg className="flex-shrink-0 w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1">
        <p className="font-medium">Error</p>
        <p className="mt-1 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-risk-high/20 transition-colors text-text-muted hover:text-risk-high"
          aria-label="Dismiss error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}