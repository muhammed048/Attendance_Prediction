
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


# Locate the backend folder and load the trained model.
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Trained model not found at {MODEL_PATH}. "
        "Run ml/train.py first."
    )

# Load the model only once when this module is imported.
model = joblib.load(MODEL_PATH)


# Keep this order consistent with the training pipeline.
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

# The model's preprocessing pipeline uses these seven numeric features.
# extracurricular is accepted by the API but was excluded during training.
MODEL_FEATURES = [
    "previous_attendance",
    "internal_marks",
    "assignment_submission_rate",
    "study_hours",
    "late_arrivals",
    "previous_gpa",
    "distance_from_college",
]


def risk_level(predicted_attendance: float) -> str:
    """Convert predicted attendance into the contract's risk category."""
    if predicted_attendance >= 85:
        return "Low"
    elif predicted_attendance >= 75:
        return "Medium"
    return "High"


def _get_feature_importances() -> dict[str, float]:
    """Read importance or coefficient values from the saved model."""
    estimator = model

    # Find the final estimator if the saved model is a pipeline.
    if hasattr(model, "named_steps"):
        estimator = model.named_steps.get("regressor", model)

    if hasattr(estimator, "feature_importances_"):
        values = np.asarray(estimator.feature_importances_, dtype=float)
    elif hasattr(estimator, "coef_"):
        values = np.abs(np.asarray(estimator.coef_, dtype=float).ravel())
    else:
        values = np.ones(len(MODEL_FEATURES), dtype=float)

    # Match importance values to the features the model actually uses.
    if len(values) != len(MODEL_FEATURES):
        values = np.ones(len(MODEL_FEATURES), dtype=float)

    total = float(values.sum())
    if total > 0:
        values = values / total
    else:
        values = np.ones(len(MODEL_FEATURES)) / len(MODEL_FEATURES)

    return dict(zip(MODEL_FEATURES, values.tolist()))


FEATURE_IMPORTANCES = _get_feature_importances()


def predict_attendance(student_data: dict) -> dict:
    """Predict attendance and return the contract's response structure."""
    missing = [feature for feature in FEATURES if feature not in student_data]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    # Keep the input order and columns consistent with training.
    input_df = pd.DataFrame(
        [{feature: student_data[feature] for feature in FEATURES}]
    )
    model_input = input_df[MODEL_FEATURES]

    prediction = float(model.predict(model_input)[0])
    prediction = float(np.clip(prediction, 0, 100))

    # Use absolute deviation from the training data's typical values.
    # StandardScaler stores the training mean and scale.
    deviations = {}
    preprocessor = None

    if hasattr(model, "named_steps"):
        preprocessor = model.named_steps.get("preprocessor")

    numeric_pipeline = None
    if preprocessor is not None and hasattr(preprocessor, "named_transformers_"):
        numeric_pipeline = preprocessor.named_transformers_.get("numeric")

    scaler = None
    if numeric_pipeline is not None and hasattr(numeric_pipeline, "named_steps"):
        scaler = numeric_pipeline.named_steps.get("scaler")

    for feature in MODEL_FEATURES:
        value = float(student_data[feature])

        if scaler is not None and hasattr(scaler, "mean_"):
            index = MODEL_FEATURES.index(feature)
            scale = float(scaler.scale_[index])
            deviation = abs(value - float(scaler.mean_[index])) / max(scale, 1e-12)
        else:
            # Fallback if the model has no fitted StandardScaler.
            deviation = abs(value)

        deviations[feature] = deviation

    # Impact score = normalized feature importance × standardized deviation.
    scores = {
        feature: FEATURE_IMPORTANCES[feature] * deviations[feature]
        for feature in MODEL_FEATURES
    }

    top_factors = [
        {
            "feature": feature,
            "impact": round(
                scores[feature]
                * (1 if float(student_data[feature]) >= 0 else -1),
                4,
            ),
        }
        for feature in sorted(scores, key=scores.get, reverse=True)[:3]
    ]

    return {
        "predicted_attendance": round(prediction, 2),
        "risk_level": risk_level(prediction),
        "top_factors": top_factors,
    }
