
import json
import sqlite3
from pathlib import Path
from contextlib import contextmanager

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.model import predict_attendance
from app.schemas import PredictionRequest, PredictionResponse


# Paths relative to the backend folder.
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "attendance.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(title="Student Attendance Prediction API")


# Allow requests from the Vite frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


FEATURES = [
    "previous_attendance",
    "internal_marks",
    "assignment_submission_rate",
    "study_hours",
    "late_arrivals",
    "previous_gpa",
    "distance_from_college",
    "extracurricular",
]


@contextmanager
def get_db_connection():
    """Open and close a SQLite connection safely."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database():
    """Create the prediction history table if it does not exist."""
    with get_db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                input_data TEXT NOT NULL,
                predicted_attendance REAL NOT NULL,
                risk_level TEXT NOT NULL,
                top_factors TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def save_prediction(input_data: dict, result: dict):
    """Save a prediction and its inputs in SQLite."""
    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO predictions
                (input_data, predicted_attendance, risk_level, top_factors)
            VALUES (?, ?, ?, ?)
            """,
            (
                json.dumps(input_data),
                result["predicted_attendance"],
                result["risk_level"],
                json.dumps(result["top_factors"]),
            ),
        )


@app.on_event("startup")
def startup_event():
    """Initialize the local database when the API starts."""
    initialize_database()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Return validation errors using the contract's detail structure."""
    errors = exc.errors()
    messages = []

    for error in errors:
        location = ".".join(str(part) for part in error["loc"])
        messages.append(f"{location}: {error['msg']}")

    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(messages)},
    )


@app.get("/")
def home():
    return {"message": "Student Attendance Prediction API is running"}


@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """Predict attendance for one student and save the result."""
    input_data = request.model_dump()

    try:
        result = predict_attendance(input_data)
        save_prediction(input_data, result)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        )


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    """Predict attendance for every row in an uploaded CSV."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        contents = await file.read()
        from io import BytesIO

        df = pd.read_csv(BytesIO(contents))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV file: {exc}",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    missing = [feature for feature in FEATURES if feature not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV columns: {missing}",
        )

    results = []

    # Validate every row before making predictions.
    for row_number, (_, row) in enumerate(df.iterrows(), start=2):
        raw_input = row[FEATURES].to_dict()

        try:
            validated = PredictionRequest.model_validate(raw_input)
            input_data = validated.model_dump()
            result = predict_attendance(input_data)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data on CSV row {row_number}: {exc}",
            )

        results.append({**input_data, **result})

    # Save only after all rows have been validated and predicted.
    for item in results:
        input_data = {feature: item[feature] for feature in FEATURES}
        result = {
            "predicted_attendance": item["predicted_attendance"],
            "risk_level": item["risk_level"],
            "top_factors": item["top_factors"],
        }
        save_prediction(input_data, result)

    return {
        "count": len(results),
        "predictions": results,
    }


@app.get("/api/students")
def get_students():
    """Return previous predictions stored in the SQLite database."""
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, input_data, predicted_attendance,
                   risk_level, top_factors, created_at
            FROM predictions
            ORDER BY id DESC
            """
        ).fetchall()

    students = []
    for row in rows:
        student = dict(row)
        student["input_data"] = json.loads(student["input_data"])
        student["top_factors"] = json.loads(student["top_factors"])
        students.append(student)

    return {"students": students}


@app.get("/api/metrics")
def get_metrics():
    """Return saved model evaluation metrics."""
    path = MODELS_DIR / "metrics.json"

    if not path.exists():
        raise HTTPException(status_code=404, detail="Metrics file not found.")

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


@app.get("/api/feature-importance")
def get_feature_importance():
    """Return the feature importance data produced during training."""
    path = MODELS_DIR / "feature_importance.json"

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Feature importance file not found.",
        )

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)
