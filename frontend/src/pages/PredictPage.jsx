import { useState } from 'react';
import { FEATURES } from '../constants';
import { predict } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import Loader, { InlineLoader } from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';

const INITIAL_FORM = {
  name: '',
  roll_no: '',
  previous_attendance: '',
  internal_marks: '',
  assignment_submission_rate: '',
  study_hours: '',
  late_arrivals: '',
  previous_gpa: '',
  distance_from_college: '',
  extracurricular: 0,
};

function validateField(name, value) {
  const feature = FEATURES.find((f) => f.name === name);
  if (!feature) return null;

  const numValue = feature.type === 'integer' ? parseInt(value, 10) : parseFloat(value);
  if (isNaN(numValue)) return `${feature.label} is required`;

  if (numValue < feature.min) return `${feature.label} must be at least ${feature.min}`;
  if (numValue > feature.max) return `${feature.label} must be at most ${feature.max}`;

  return null;
}

function validateForm(formData) {
  const errors = {};
  FEATURES.forEach((feature) => {
    const error = validateField(feature.name, formData[feature.name]);
    if (error) errors[feature.name] = error;
  });
  if (!formData.name.trim()) errors.name = 'Name is required';
  if (!formData.roll_no.trim()) errors.roll_no = 'Roll number is required';
  return errors;
}

function getPayload(formData) {
  return {
    previous_attendance: parseFloat(formData.previous_attendance),
    internal_marks: parseFloat(formData.internal_marks),
    assignment_submission_rate: parseFloat(formData.assignment_submission_rate),
    study_hours: parseFloat(formData.study_hours),
    late_arrivals: parseInt(formData.late_arrivals, 10),
    previous_gpa: parseFloat(formData.previous_gpa),
    distance_from_college: parseFloat(formData.distance_from_college),
    extracurricular: formData.extracurricular,
  };
}

function PredictionForm({ onPredict, isLoading, error }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setTouched(
      FEATURES.reduce((acc, f) => ({ ...acc, [f.name]: true }), { name: true, roll_no: true })
    );
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await onPredict(getPayload(formData));
    } catch {
      // Error handled by parent
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setTouched({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="label">Student Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.name && touched.name ? 'border-risk-high' : ''}`}
            placeholder="Enter student name"
            disabled={isLoading}
          />
          {errors.name && touched.name && <p className="mt-1 text-sm text-risk-high">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="roll_no" className="label">Roll Number</label>
          <input
            id="roll_no"
            name="roll_no"
            type="text"
            value={formData.roll_no}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${errors.roll_no && touched.roll_no ? 'border-risk-high' : ''}`}
            placeholder="e.g., MUT24AD001"
            disabled={isLoading}
          />
          {errors.roll_no && touched.roll_no && <p className="mt-1 text-sm text-risk-high">{errors.roll_no}</p>}
        </div>
      </div>

      <fieldset className="space-y-4" disabled={isLoading}>
        <legend className="text-sm font-medium text-muted-gray">Academic Features</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <div key={feature.name}>
              <label htmlFor={feature.name} className="label">
                {feature.label} {feature.unit && <span className="text-xs text-muted-gray">({feature.unit})</span>}
              </label>
              {feature.name === 'extracurricular' ? (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id={feature.name}
                      name={feature.name}
                      checked={formData[feature.name] === 1}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border-passive text-charcoal focus:ring-charcoal focus:ring-2"
                    />
                    <span className="text-sm text-charcoal">Yes</span>
                  </label>
                  <span className="text-xs text-muted-gray">
                    {formData[feature.name] === 1 ? 'Active' : 'None'}
                  </span>
                </div>
              ) : (
                <input
                  id={feature.name}
                  name={feature.name}
                  type="number"
                  step={feature.type === 'integer' ? '1' : '0.1'}
                  min={feature.min}
                  max={feature.max}
                  value={formData[feature.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input ${errors[feature.name] && touched[feature.name] ? 'border-risk-high' : ''}`}
                  placeholder={`${feature.min}-${feature.max}`}
                />
              )}
              {errors[feature.name] && touched[feature.name] && (
                <p className="mt-1 text-sm text-risk-high">{errors[feature.name]}</p>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary flex-1 sm:flex-none"
          disabled={isLoading}
        >
          {isLoading ? <InlineLoader label="Predicting..." /> : 'Predict Attendance'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-secondary flex-1 sm:flex-none"
          disabled={isLoading}
        >
          Reset
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
    </form>
  );
}

function FactorBar({ feature, impact, maxImpact }) {
  const width = maxImpact > 0 ? Math.abs((impact / maxImpact) * 100) : 0;
  const isPositive = impact >= 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-charcoal">{feature}</span>
        <span className="text-muted-gray">{impact > 0 ? '+' : ''}{impact.toFixed(3)}</span>
      </div>
      <div className="w-full h-2 bg-border-passive rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPositive ? 'bg-risk-low' : 'bg-risk-high'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ResultCard({ result, isLoading, error }) {
  if (isLoading && !result) {
    return (
      <div className="card flex items-center justify-center min-h-[300px]">
        <Loader size="lg" label="Analyzing student data..." />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="card flex flex-col items-center justify-center min-h-[300px] text-center">
        <ErrorBanner message={error} className="w-full max-w-md" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card flex flex-col items-center justify-center min-h-[300px] text-center text-muted-gray">
        <svg className="w-16 h-16 mb-4 text-border-passive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-lg font-medium text-charcoal">Enter student details</p>
        <p className="mt-1 text-sm">Fill the form and click Predict to see results</p>
      </div>
    );
  }

  const riskLevel = result.risk_level;
  const predicted = result.predicted_attendance;
  const factors = result.top_factors || [];
  const maxImpact = Math.max(...factors.map((f) => Math.abs(f.impact)), 1);

  return (
    <div className="card space-y-6">
      <div className="text-center space-y-4">
        <div className="relative w-40 h-40 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-border-passive)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={`var(--color-risk-${riskLevel.toLowerCase()})`}
              strokeWidth="8"
              strokeDasharray={`${(predicted / 100) * 282.7} 282.7`}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-charcoal">{predicted.toFixed(1)}%</span>
            <span className="text-xs text-muted-gray">Predicted Attendance</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <RiskBadge riskLevel={riskLevel} />
          <span className="text-sm text-muted-gray">
            Risk: {riskLevel} ({predicted >= 85 ? '≥85%' : predicted >= 75 ? '75-84%' : '<75%'})
          </span>
        </div>
      </div>

      <div className="border-t border-border-passive pt-6">
        <h3 className="text-sm font-semibold text-muted-gray mb-4">Top Contributing Factors</h3>
        <div className="space-y-4">
          {factors.map((factor, index) => (
            <FactorBar key={index} {...factor} maxImpact={maxImpact} />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border-passive flex justify-end">
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => window.navigator.clipboard.writeText(
            `Student: ${predicted.toFixed(1)}% attendance, ${riskLevel} risk`
          )}
        >
          Copy Result
        </button>
      </div>
    </div>
  );
}

export default function PredictPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await predict(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Prediction failed');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="heading-sub tracking-tight">Predict Attendance</h1>
        <p className="body-muted">Enter student details to predict attendance risk</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <PredictionForm onPredict={handlePredict} isLoading={isLoading} error={error} result={result} />
        </div>
        <div>
          <ResultCard result={result} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}