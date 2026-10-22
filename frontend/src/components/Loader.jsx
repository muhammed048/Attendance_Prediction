export default function Loader({ size = 'md', className = '', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
      <svg
        className={`animate-spin text-accent ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="text-border" cx="12" cy="12" r="10" strokeWidth="4" />
        <path className="stroke-current" d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" strokeWidth="4" />
      </svg>
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  );
}

export function InlineLoader({ className = '', label }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <svg
        className="animate-spin w-4 h-4 text-accent"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="text-border" cx="12" cy="12" r="10" strokeWidth="4" />
        <path className="stroke-current" d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" strokeWidth="4" />
      </svg>
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </div>
  );
}