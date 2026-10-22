export const FEATURES = [
  { name: 'previous_attendance', label: 'Previous Attendance', min: 0, max: 100, type: 'number', unit: '%' },
  { name: 'internal_marks', label: 'Internal Marks', min: 0, max: 100, type: 'number', unit: '%' },
  { name: 'assignment_submission_rate', label: 'Assignment Submission Rate', min: 0, max: 100, type: 'number', unit: '%' },
  { name: 'study_hours', label: 'Study Hours', min: 0, max: 12, type: 'number', unit: 'hrs/day' },
  { name: 'late_arrivals', label: 'Late Arrivals', min: 0, max: 50, type: 'integer', unit: 'times' },
  { name: 'previous_gpa', label: 'Previous GPA', min: 0, max: 10, type: 'number', unit: '' },
  { name: 'distance_from_college', label: 'Distance from College', min: 0, max: 100, type: 'number', unit: 'km' },
  { name: 'extracurricular', label: 'Extracurricular', min: 0, max: 1, type: 'integer', unit: '' }
];

export const RISK_THRESHOLDS = {
  LOW: 85,
  MEDIUM: 75
};

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

export const RISK_COLORS = {
  Low: 'green',
  Medium: 'amber',
  High: 'red'
};

export function getRiskLevel(predictedAttendance) {
  if (predictedAttendance >= RISK_THRESHOLDS.LOW) return RISK_LEVELS.LOW;
  if (predictedAttendance >= RISK_THRESHOLDS.MEDIUM) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.HIGH;
}

export function getRiskColor(riskLevel) {
  return RISK_COLORS[riskLevel] || 'gray';
}