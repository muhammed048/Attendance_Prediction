import { useState, useEffect, useMemo } from 'react';
import { getStudents } from '../services/api';
import { RISK_LEVELS } from '../constants';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { chartTheme, getSeriesColor } from '../chartTheme';

const COLUMNS = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'roll_no', label: 'Roll No', sortable: true },
  { key: 'predicted_attendance', label: 'Attendance %', sortable: true },
  { key: 'risk_level', label: 'Risk', sortable: true },
  { key: 'created_at', label: 'Date', sortable: true },
];

function getRiskCounts(students) {
  return {
    [RISK_LEVELS.LOW]: students.filter((s) => s.risk_level === RISK_LEVELS.LOW).length,
    [RISK_LEVELS.MEDIUM]: students.filter((s) => s.risk_level === RISK_LEVELS.MEDIUM).length,
    [RISK_LEVELS.HIGH]: students.filter((s) => s.risk_level === RISK_LEVELS.HIGH).length,
  };
}

function getAttendanceBuckets(students) {
  const buckets = {};
  for (let i = 0; i <= 100; i += 10) {
    buckets[`${i}-${i + 9}`] = 0;
  }
  buckets['100'] = 0;

  students.forEach((s) => {
    const attendance = Math.floor(s.predicted_attendance);
    if (attendance === 100) {
      buckets['100']++;
    } else {
      const bucketStart = Math.floor(attendance / 10) * 10;
      const key = `${bucketStart}-${bucketStart + 9}`;
      if (buckets[key] !== undefined) buckets[key]++;
    }
  });

  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

function StudentTable({ students, sortConfig, onSort, searchTerm, riskFilter }) {
  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.input_data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.input_data.roll_no?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || student.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [students, searchTerm, riskFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'name') {
        aVal = a.input_data.name || '';
        bVal = b.input_data.name || '';
      } else if (sortConfig.key === 'roll_no') {
        aVal = a.input_data.roll_no || '';
        bVal = b.input_data.roll_no || '';
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const handleSort = (key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    onSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-gray">
        <EmptyState
          icon="🔍"
          title="No students found"
          description="Try adjusting your search or filter"
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b border-border-passive text-left text-muted-gray">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium ${col.sortable ? 'cursor-pointer hover:text-charcoal select-none' : ''}`}
                onClick={() => handleSort(col.key)}
                style={{ userSelect: col.sortable ? 'none' : 'auto' }}
                aria-sort={
                  sortConfig.key === col.key
                    ? sortConfig.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortConfig.key === col.key && (
                    <span aria-hidden="true">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-passive">
          {sorted.map((student) => (
            <tr key={student.id} className="hover:bg-charcoal-03 transition-colors">
              <td className="px-4 py-3 text-muted-gray">{student.id}</td>
              <td className="px-4 py-3 font-medium text-charcoal">{student.input_data.name || 'Unknown'}</td>
              <td className="px-4 py-3 text-muted-gray font-mono">{student.input_data.roll_no || 'N/A'}</td>
              <td className="px-4 py-3 text-charcoal">{student.predicted_attendance.toFixed(1)}%</td>
              <td className="px-4 py-3">
                <RiskBadge riskLevel={student.risk_level} />
              </td>
              <td className="px-4 py-3 text-muted-gray">
                {new Date(student.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceDistributionChart({ students }) {
  const data = useMemo(() => getAttendanceBuckets(students), [students]);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartTheme.spacing.margin}>
            <CartesianGrid {...chartTheme.grid.horizontal} />
            <XAxis
              dataKey="range"
              {...chartTheme.axis.x}
            />
            <YAxis
              {...chartTheme.axis.y}
              domain={[0, Math.max(maxCount + 1, 5)]}
            />
            <Tooltip
              {...chartTheme.tooltip}
              formatter={(value) => [value, 'Students']}
            />
            <Bar
              dataKey="count"
              radius={[chartTheme.radius.bar, chartTheme.radius.bar, 0, 0]}
              barSize={30}
              maxBarSize={chartTheme.radius.barMax}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={getSeriesColor(0)} />
              ))}
            </Bar>
            <ReferenceLine
              x={7.5}
              stroke="var(--color-risk-medium)"
              {...chartTheme.referenceLine}
              label={{ value: '75%', position: 'top', fill: 'var(--color-risk-medium)', fontSize: 10 }}
            />
            <ReferenceLine
              x={8.5}
              stroke="var(--color-risk-low)"
              {...chartTheme.referenceLine}
              label={{ value: '85%', position: 'top', fill: 'var(--color-risk-low)', fontSize: 10 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-muted-gray flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-risk-medium)' }} />
          Medium threshold (75%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-risk-low)' }} />
          Low threshold (85%)
        </span>
      </p>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  useEffect(() => {
    async function fetchStudents() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getStudents();
        setStudents(data.students || []);
      } catch (err) {
        setError(err.message || 'Failed to load students');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const riskCounts = useMemo(() => getRiskCounts(students), [students]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="heading-sub tracking-tight">Student History</h1>
          <p className="body-muted">View all previous predictions</p>
        </header>
        <div className="grid sm:grid-cols-3 gap-4">
          {[RISK_LEVELS.LOW, RISK_LEVELS.MEDIUM, RISK_LEVELS.HIGH].map((level) => (
            <StatCard
              key={level}
              title={`${level} Risk`}
              value={<Loader size="sm" label="" />}
              className="animate-pulse"
            />
          ))}
        </div>
        <div className="card animate-pulse h-64" />
        <div className="card animate-pulse h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="heading-sub tracking-tight">Student History</h1>
          <p className="body-muted">View all previous predictions</p>
        </header>
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-sub tracking-tight">Student History</h1>
        <p className="body-muted">View all previous predictions</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          title="Low Risk"
          value={riskCounts[RISK_LEVELS.LOW]}
          subtitle="≥ 85% attendance"
          icon="✅"
        />
        <StatCard
          title="Medium Risk"
          value={riskCounts[RISK_LEVELS.MEDIUM]}
          subtitle="75-84% attendance"
          icon="⚠️"
        />
        <StatCard
          title="High Risk"
          value={riskCounts[RISK_LEVELS.HIGH]}
          subtitle="< 75% attendance"
          icon="🚨"
        />
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="label">Search</label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or roll number..."
              className="input"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="risk-filter" className="label">Risk Level</label>
            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Levels</option>
              <option value={RISK_LEVELS.LOW}>Low</option>
              <option value={RISK_LEVELS.MEDIUM}>Medium</option>
              <option value={RISK_LEVELS.HIGH}>High</option>
            </select>
          </div>
        </div>

        <StudentTable
          students={students}
          sortConfig={sortConfig}
          onSort={setSortConfig}
          searchTerm={searchTerm}
          riskFilter={riskFilter}
        />
      </div>

      {students.length > 0 && <AttendanceDistributionChart students={students} />}
    </div>
  );
}