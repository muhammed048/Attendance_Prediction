export const chartTheme = {
  colors: {
    grid: 'hsl(var(--color-border-passive))',
    axisTick: 'hsl(var(--color-muted-gray))',
    axisLine: 'hsl(var(--color-border-passive))',
    textPrimary: 'hsl(var(--color-charcoal))',
    textMuted: 'hsl(var(--color-muted-gray))',
    tooltipBg: 'hsl(var(--color-cream))',
    tooltipBorder: 'hsl(var(--color-border-passive))',
    series: [
      'hsl(var(--color-charcoal))',
      'hsl(var(--color-accent))',
      'hsl(var(--color-risk-low))',
      'hsl(var(--color-risk-medium))',
      'hsl(var(--color-risk-high))',
    ],
  },
  radius: {
    bar: 4,
    barMax: 40,
  },
  spacing: {
    margin: { top: 10, right: 20, left: 0, bottom: 0 },
    marginVertical: { top: 10, right: 30, left: 10, bottom: 10 },
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--color-cream))',
      border: '1px solid hsl(var(--color-border-passive))',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    labelStyle: {
      color: 'hsl(var(--color-charcoal))',
      fontSize: '12px',
      fontWeight: 600,
    },
    formatter: (value, name) => [value, name],
  },
  axis: {
    x: {
      tick: { fill: 'hsl(var(--color-muted-gray))', fontSize: 11 },
      axisLine: { stroke: 'hsl(var(--color-border-passive))' },
      tickLine: { stroke: 'hsl(var(--color-border-passive))' },
    },
    y: {
      tick: { fill: 'hsl(var(--color-muted-gray))', fontSize: 11 },
      axisLine: { stroke: 'none' },
      tickLine: { stroke: 'none' },
    },
    categoryY: {
      width: 160,
      tick: { fill: 'hsl(var(--color-charcoal))', fontSize: 12 },
      axisLine: { stroke: 'none' },
      tickLine: { stroke: 'none' },
    },
  },
  grid: {
    vertical: { strokeDasharray: '3 3', stroke: 'hsl(var(--color-border-passive))' },
    horizontal: { strokeDasharray: '3 3', stroke: 'hsl(var(--color-border-passive))' },
  },
  referenceLine: {
    strokeDasharray: '5 5',
    strokeWidth: 2,
    label: { fill: 'hsl(var(--color-muted-gray))', fontSize: 10 },
  },
};

export function getSeriesColor(index) {
  return chartTheme.colors.series[index % chartTheme.colors.series.length];
}