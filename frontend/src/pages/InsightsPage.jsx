import { useState, useEffect, useMemo } from 'react';
import { getMetrics, getFeatureImportance } from '../services/api';
import { FEATURES } from '../constants';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { chartTheme, getSeriesColor } from '../chartTheme';

const FEATURE_LABELS = Object.fromEntries(FEATURES.map((f) => [f.name, f.label]));

function ConfusionMatrix({ matrix }) {
  const [[tn, fp], [fn, tp]] = matrix;
  const cells = [
    { label: 'True Negative', value: tn, bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', desc: 'Correctly predicted Low/Medium risk' },
    { label: 'False Positive', value: fp, bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', desc: 'Incorrectly predicted High risk' },
    { label: 'False Negative', value: fn, bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', desc: 'Incorrectly predicted Low/Medium risk' },
    { label: 'True Positive', value: tp, bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', desc: 'Correctly predicted High risk' },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Confusion Matrix (At-Risk Detection)</h3>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border text-center ${cell.bg} ${cell.border}`}
          >
            <p className="text-3xl font-bold text-charcoal">{cell.value}</p>
            <p className="text-sm font-medium text-muted-gray mt-1">{cell.label}</p>
            <p className="text-xs text-muted-gray mt-2">{cell.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-gray text-center">
        Rows: Actual | Columns: Predicted | High risk = Positive class
      </p>
    </div>
  );
}

function RegressionMetricsTable({ regression, bestModel }) {
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Regression Metrics</h3>
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border-passive text-left text-muted-gray">
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium text-right">MAE</th>
            <th className="px-4 py-3 font-medium text-right">MSE</th>
            <th className="px-4 py-3 font-medium text-right">RMSE</th>
            <th className="px-4 py-3 font-medium text-right">R²</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-passive">
          {regression.map((row) => (
            <tr
              key={row.model}
              className={`transition-colors ${
                row.model === bestModel
                  ? 'bg-charcoal-03 border-l-4 border-charcoal'
                  : 'hover:bg-charcoal-03'
              }`}
            >
              <td className="px-4 py-3 font-medium text-charcoal">
                {row.model} {row.model === bestModel && (
                  <span className="ml-2 badge badge-low text-xs">Best</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-gray text-right font-mono">{row.mae.toFixed(4)}</td>
              <td className="px-4 py-3 text-muted-gray text-right font-mono">{row.mse.toFixed(4)}</td>
              <td className="px-4 py-3 text-muted-gray text-right font-mono">{row.rmse.toFixed(4)}</td>
              <td className="px-4 py-3 text-muted-gray text-right font-mono">{row.r2.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-gray">
        MAE = Mean Absolute Error | MSE = Mean Squared Error | RMSE = Root Mean Squared Error | R² = Coefficient of Determination
      </p>
    </div>
  );
}

function ClassificationMetricsCards({ classification }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <StatCard
        title="Accuracy"
        value={`${(classification.accuracy * 100).toFixed(1)}%`}
        subtitle="Overall correct predictions"
        icon="🎯"
      />
      <StatCard
        title="Precision"
        value={`${(classification.precision * 100).toFixed(1)}%`}
        subtitle="Of predicted high-risk, actually high-risk"
        icon="🔍"
      />
      <StatCard
        title="Recall"
        value={`${(classification.recall * 100).toFixed(1)}%`}
        subtitle="Of actual high-risk, correctly identified"
        icon="📋"
      />
    </div>
  );
}

function FeatureImportanceChart({ features }) {
  const sortedFeatures = useMemo(() => {
    return [...features]
      .map((f) => ({
        ...f,
        label: FEATURE_LABELS[f.feature] || f.feature,
      }))
      .sort((a, b) => b.importance - a.importance);
  }, [features]);

  const maxImportance = Math.max(...sortedFeatures.map((f) => f.importance));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Feature Importance</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedFeatures}
            layout="vertical"
            margin={chartTheme.spacing.marginVertical}
          >
            <CartesianGrid {...chartTheme.grid.horizontal} />
            <XAxis
              type="number"
              domain={[0, maxImportance * 1.15]}
              {...chartTheme.axis.x}
              tickFormatter={(v) => (v * 100).toFixed(0) + '%'}
            />
            <YAxis
              type="category"
              dataKey="label"
              {...chartTheme.axis.categoryY}
            />
            <Tooltip
              {...chartTheme.tooltip}
              formatter={(value) => [(value * 100).toFixed(1) + '%', 'Importance']}
            />
            <Bar dataKey="importance" radius={[0, chartTheme.radius.bar, chartTheme.radius.bar, 0]} barSize={30} maxBarSize={chartTheme.radius.barMax}>
              {sortedFeatures.map((_, index) => (
                <Cell key={index} fill={getSeriesColor(0)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-gray">
        Normalized importance weights from the trained model (LinearRegression coefficients)
      </p>
    </div>
  );
}

function MetricsLoader() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-sub tracking-tight">Insights</h1>
        <p className="body-muted">Model metrics and feature importance</p>
      </header>
      <div className="animate-pulse space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <StatCard key={i} title="Loading..." value={<Loader size="sm" />} className="h-24" />
          ))}
        </div>
        <div className="card animate-pulse h-64" />
        <div className="card animate-pulse h-64" />
        <div className="card animate-pulse h-[300px]" />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [metrics, setMetrics] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [metricsData, fiData] = await Promise.all([getMetrics(), getFeatureImportance()]);
        setMetrics(metricsData);
        setFeatureImportance(fiData);
      } catch (err) {
        setError(err.message || 'Failed to load insights');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <MetricsLoader />;

  if (error) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="heading-sub tracking-tight">Insights</h1>
          <p className="body-muted">Model metrics and feature importance</p>
        </header>
        <ErrorBanner message={error} />
      </div>
    );
  }

  const { best_model, regression, classification } = metrics;
  const features = featureImportance?.features || [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-sub tracking-tight">Insights</h1>
        <p className="body-muted">Model metrics and feature importance</p>
      </header>

      <div className="space-y-6">
        <RegressionMetricsTable regression={regression} bestModel={best_model} />
        <ClassificationMetricsCards classification={classification} />
        <ConfusionMatrix matrix={classification.confusion_matrix} />
        <FeatureImportanceChart features={features} />
      </div>
    </div>
  );
}