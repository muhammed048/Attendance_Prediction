export default function StatCard({ title, value, subtitle, trend, icon, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-muted truncate">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-text truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-sm font-medium ${trend.positive ? 'text-risk-low' : 'text-risk-high'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-2xl" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}