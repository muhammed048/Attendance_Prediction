import { useState, useCallback, useMemo } from 'react';
import { predictBatch } from '../services/api';
import { FEATURES, RISK_LEVELS } from '../constants';
import RiskBadge from '../components/RiskBadge';
import { InlineLoader } from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';

const TEMPLATE_HEADERS = [
  'name',
  'roll_no',
  ...FEATURES.map((f) => f.name),
];

const TEMPLATE_ROWS = [
  {
    name: 'John Doe',
    roll_no: 'MUT24AD001',
    previous_attendance: 92,
    internal_marks: 85,
    assignment_submission_rate: 95,
    study_hours: 4,
    late_arrivals: 2,
    previous_gpa: 8.8,
    distance_from_college: 5,
    extracurricular: 1,
  },
  {
    name: 'Jane Smith',
    roll_no: 'MUT24AD002',
    previous_attendance: 75,
    internal_marks: 68,
    assignment_submission_rate: 80,
    study_hours: 2.5,
    late_arrivals: 12,
    previous_gpa: 7.2,
    distance_from_college: 15,
    extracurricular: 1,
  },
];

function generateCSV(headers, rows) {
  const escape = (val) => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) => headers.map((h) => escape(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n');
}

function downloadCSV(filename, headers, rows) {
  const csv = generateCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function FileDropzone({ onFileSelect, disabled, error }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'text/csv') {
        onFileSelect(file);
      } else if (file) {
        onFileSelect(null);
      }
    },
    [disabled, onFileSelect]
  );

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    } else if (file) {
      onFileSelect(null);
    }
    e.target.value = '';
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver
          ? 'border-charcoal bg-charcoal-03'
          : error
          ? 'border-risk-high bg-risk-high/5'
          : 'border-border-passive hover:border-charcoal/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="CSV file dropzone"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
        aria-hidden="true"
      />
      <svg
        className="w-12 h-12 mx-auto mb-4 text-muted-gray"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-lg font-medium text-charcoal mb-1">
        {isDragOver ? 'Drop CSV file here' : 'Drag & drop CSV file, or click to browse'}
      </p>
      <p className="text-sm text-muted-gray mb-4">.csv files only</p>
      {error && (
        <p className="text-sm text-risk-high" role="alert">
          Please select a valid .csv file
        </p>
      )}
    </div>
  );
}

const RISK_ORDER = { [RISK_LEVELS.HIGH]: 0, [RISK_LEVELS.MEDIUM]: 1, [RISK_LEVELS.LOW]: 2 };

function ResultsTable({ results }) {
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);
  }, [results]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'roll_no', label: 'Roll No' },
    { key: 'predicted_attendance', label: 'Attendance %', format: (v) => v.toFixed(1) },
    { key: 'risk_level', label: 'Risk', render: (v) => <RiskBadge riskLevel={v} /> },
    { key: 'previous_attendance', label: 'Prev Attendance' },
    { key: 'internal_marks', label: 'Internal Marks' },
    { key: 'assignment_submission_rate', label: 'Assignment Rate' },
    { key: 'study_hours', label: 'Study Hours' },
    { key: 'late_arrivals', label: 'Late Arrivals' },
    { key: 'previous_gpa', label: 'Prev GPA' },
    { key: 'distance_from_college', label: 'Distance (km)' },
    { key: 'extracurricular', label: 'Extracurricular', format: (v) => (v ? 'Yes' : 'No') },
  ];

  const exportHeaders = columns.map((c) => c.key);

  const handleExport = () => {
    const rows = sortedResults.map((r) =>
      columns.reduce((acc, col) => {
        acc[col.key] = col.format ? col.format(r[col.key]) : r[col.key];
        return acc;
      }, {})
    );
    downloadCSV('batch_predictions.csv', exportHeaders, rows);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-charcoal">Results ({sortedResults.length})</h3>
        <button
          type="button"
          onClick={handleExport}
          className="btn btn-secondary text-sm"
        >
          Export results as CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-border-passive text-left text-muted-gray">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium text-charcoal">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-passive">
            {sortedResults.map((row, index) => (
              <tr key={index} className="hover:bg-charcoal-03 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-charcoal">
                    {col.render ? col.render(row[col.key]) : col.format ? col.format(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BatchPage() {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      setFileError(true);
      setFile(null);
      return;
    }
    setFileError(false);
    setFile(selectedFile);
    setError(null);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = await predictBatch(file);
      setResults(data.predictions || data.results || []);
    } catch (err) {
      setError(err.message || 'Batch prediction failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSV('template.csv', TEMPLATE_HEADERS, TEMPLATE_ROWS);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-sub tracking-tight">Batch Prediction</h1>
        <p className="body-muted">Upload CSV file for bulk attendance predictions</p>
      </header>

      <div className="card space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-charcoal mb-4">Upload CSV</h2>
          <FileDropzone
            onFileSelect={handleFileSelect}
            disabled={isUploading}
            error={fileError}
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="btn btn-primary"
            >
              {isUploading ? <InlineLoader label="Processing..." /> : 'Upload & Predict'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn btn-secondary"
            >
              Download Template CSV
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-gray">
            Template includes: name, roll_no, and all 8 features (previous_attendance, internal_marks, assignment_submission_rate, study_hours, late_arrivals, previous_gpa, distance_from_college, extracurricular)
          </p>
        </section>

        {error && <ErrorBanner message={error} />}

        {results && results.length > 0 && <ResultsTable results={results} />}
      </div>
    </div>
  );
}