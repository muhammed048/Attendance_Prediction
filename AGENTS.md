# Attendance Prediction - Agent Guide

## Project Structure
- `backend/` - FastAPI ML service (Python 3.11+)
- `backend/app/` - API routes, schemas, model inference
- `backend/ml/` - Training pipeline (`train.py`) and data generation (`generate_data.py`)
- `backend/models/` - Saved model artifacts (`.joblib`, `.json`)
- `backend/data/` - CSV datasets and SQLite DB
- `backend/venv/` - Virtual environment (ignored by git)

## Key Commands

### Setup & Training
```bash
cd backend
# Activate venv (Windows)
.\venv\Scripts\activate

# Generate synthetic training data
python ml/generate_data.py

# Train model (produces best_model.joblib, metrics.json, feature_importance.json)
python ml/train.py
```

### Run API Server
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Test API
```bash
cd backend
python test_api.py
```

## Important Contracts
- **Input features** (8): `previous_attendance`, `internal_marks`, `assignment_submission_rate`, `study_hours`, `late_arrivals`, `previous_gpa`, `distance_from_college`, `extracurricular`
- **Model features** (7): excludes `extracurricular` (dropped during training)
- **Risk levels**: Low (≥85%), Medium (≥75%), High (<75%)
- **API endpoints**: `POST /api/predict`, `POST /api/predict/batch`, `GET /api/students`, `GET /api/metrics`, `GET /api/feature-importance`

## Model Pipeline
- Saved as `sklearn.Pipeline` with preprocessing (imputer + scaler) + feature selection + regressor
- Best model selected by MAE (LinearRegression, RandomForest, GradientBoosting)
- Classifier for at-risk detection uses RandomForest with balanced class weights

## Gotchas
- Model file must exist before starting API (`ml/train.py` first)
- `extracurricular` is required in API input but unused by model
- CORS allows only `http://localhost:5173` (Vite default)
- SQLite DB auto-created at `backend/data/attendance.db` on startup
- No pytest suite; `test_api.py` is a manual integration test requiring running server