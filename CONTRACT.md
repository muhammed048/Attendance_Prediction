# CONTRACT.md: Student Attendance Prediction

RULE: Use these exact endpoint paths, JSON field names, and folder
names. Do not rename anything.

## Ports
- Backend (FastAPI): http://localhost:8000
- Frontend (Vite): http://localhost:5173
- CORS: allow http://localhost:5173

## Input features (snake_case, used everywhere)
| Field | Type | Range |
|---|---|---|
| previous_attendance | float | 0-100 |
| internal_marks | float | 0-100 |
| assignment_submission_rate | float | 0-100 |
| study_hours | float | 0-12 (per day) |
| late_arrivals | int | 0-50 |
| previous_gpa | float | 0-10 |
| distance_from_college | float | 0-100 (km) |
| extracurricular | int | 0 or 1 |

## Output fields
- predicted_attendance: float, 0-100
- risk_level: "Low" | "Medium" | "High"
  (Low >= 85, Medium 75-84.99, High < 75)
- top_factors: array of 3 objects {feature, impact}

## Endpoints

### POST /api/predict
Request: { "name": "Asha", "roll_no": "MUT24AD001", ...8 features }
Response:
{
  "name": "Asha",
  "roll_no": "MUT24AD001",
  "predicted_attendance": 72.4,
  "risk_level": "High",
  "top_factors": [
    {"feature": "previous_attendance", "impact": 0.42},
    {"feature": "late_arrivals", "impact": 0.18},
    {"feature": "study_hours", "impact": 0.11}
  ]
}

### POST /api/predict/batch
Request: multipart/form-data, key "file" (CSV, headers = field names)
Response: { "count": 50, "results": [ ...predict responses ] }

### GET /api/students
Response: { "students": [ ...predict responses ] }

### GET /api/metrics
Response:
{
  "best_model": "RandomForest",
  "regression": [
    {"model": "LinearRegression", "mae": 0, "mse": 0, "rmse": 0, "r2": 0}
  ],
  "classification": {
    "accuracy": 0, "precision": 0, "recall": 0,
    "confusion_matrix": [[0, 0], [0, 0]]
  }
}

### GET /api/feature-importance
Response: { "features": [ {"feature": "previous_attendance", "importance": 0.42} ] }

## Errors (all endpoints)
Status 400/422: { "detail": "message here" }

## Folders
backend/  app/main.py, app/schemas.py, app/model.py, ml/train.py,
          data/, models/, requirements.txt
frontend/ src/pages/, src/components/, src/services/api.js,
          src/mock/mockData.js

## Ownership
- Backend person: backend/ only
- Frontend person: frontend/ only
- Changes to this file need both people's agreement