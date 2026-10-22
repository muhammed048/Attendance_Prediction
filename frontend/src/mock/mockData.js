export const mockPredictions = [
  {
    name: 'Asha Kumar',
    roll_no: 'MUT24AD001',
    predicted_attendance: 72.4,
    risk_level: 'High',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.42 },
      { feature: 'late_arrivals', impact: 0.18 },
      { feature: 'study_hours', impact: 0.11 },
    ],
  },
  {
    name: 'Rahul Sharma',
    roll_no: 'MUT24AD002',
    predicted_attendance: 88.2,
    risk_level: 'Low',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.38 },
      { feature: 'internal_marks', impact: 0.22 },
      { feature: 'assignment_submission_rate', impact: 0.15 },
    ],
  },
  {
    name: 'Priya Patel',
    roll_no: 'MUT24AD003',
    predicted_attendance: 79.5,
    risk_level: 'Medium',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.35 },
      { feature: 'study_hours', impact: 0.2 },
      { feature: 'late_arrivals', impact: 0.14 },
    ],
  },
  {
    name: 'Arjun Singh',
    roll_no: 'MUT24AD004',
    predicted_attendance: 91.7,
    risk_level: 'Low',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.4 },
      { feature: 'internal_marks', impact: 0.25 },
      { feature: 'previous_gpa', impact: 0.12 },
    ],
  },
  {
    name: 'Sneha Reddy',
    roll_no: 'MUT24AD005',
    predicted_attendance: 65.3,
    risk_level: 'High',
    top_factors: [
      { feature: 'late_arrivals', impact: 0.32 },
      { feature: 'previous_attendance', impact: 0.28 },
      { feature: 'distance_from_college', impact: 0.18 },
    ],
  },
]

export const mockMetrics = {
  best_model: 'RandomForest',
  regression: [
    { model: 'LinearRegression', mae: 4.23, mse: 32.1, rmse: 5.66, r2: 0.71 },
    { model: 'RandomForest', mae: 3.12, mse: 18.7, rmse: 4.32, r2: 0.83 },
    { model: 'GradientBoosting', mae: 3.45, mse: 21.2, rmse: 4.6, r2: 0.8 },
  ],
  classification: {
    accuracy: 0.87,
    precision: 0.84,
    recall: 0.89,
    confusion_matrix: [[42, 8], [6, 44]],
  },
}

export const mockFeatureImportance = {
  features: [
    { feature: 'previous_attendance', importance: 0.38 },
    { feature: 'internal_marks', importance: 0.22 },
    { feature: 'assignment_submission_rate', importance: 0.14 },
    { feature: 'study_hours', importance: 0.11 },
    { feature: 'late_arrivals', importance: 0.09 },
    { feature: 'previous_gpa', importance: 0.04 },
    { feature: 'distance_from_college', importance: 0.02 },
  ],
}

export const mockStudentHistory = [
  {
    id: 1,
    input_data: {
      name: 'Asha Kumar',
      roll_no: 'MUT24AD001',
      previous_attendance: 75,
      internal_marks: 68,
      assignment_submission_rate: 80,
      study_hours: 2.5,
      late_arrivals: 12,
      previous_gpa: 7.2,
      distance_from_college: 15,
      extracurricular: 1,
    },
    predicted_attendance: 72.4,
    risk_level: 'High',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.42 },
      { feature: 'late_arrivals', impact: 0.18 },
      { feature: 'study_hours', impact: 0.11 },
    ],
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    input_data: {
      name: 'Rahul Sharma',
      roll_no: 'MUT24AD002',
      previous_attendance: 92,
      internal_marks: 85,
      assignment_submission_rate: 95,
      study_hours: 4,
      late_arrivals: 2,
      previous_gpa: 8.8,
      distance_from_college: 5,
      extracurricular: 1,
    },
    predicted_attendance: 88.2,
    risk_level: 'Low',
    top_factors: [
      { feature: 'previous_attendance', impact: 0.38 },
      { feature: 'internal_marks', impact: 0.22 },
      { feature: 'assignment_submission_rate', impact: 0.15 },
    ],
    created_at: '2024-01-14T14:20:00Z',
  },
]