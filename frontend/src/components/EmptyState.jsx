export default function EmptyState({ icon = '📭', title = 'No data', description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`} role="status">
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-2 text-text-muted max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="btn btn-primary"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}