export default function StatCard({ title, value, subtitle, trend, icon, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-gray truncate">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-charcoal truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-gray">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-sm font-medium ${trend.positive ? 'text-risk-low' : 'text-risk-high'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-charcoal-04 flex items-center justify-center text-2xl" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}