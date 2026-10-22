
from pathlib import Path

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
N_STUDENTS = 1500
RANDOM_SEED = 42

OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "students.csv"
)

rng = np.random.default_rng(RANDOM_SEED)


# ---------------------------------------------------------
# Generate student features
# Skewed distributions represent a mix of typical and
# less-engaged students without forcing attendance labels.
# ---------------------------------------------------------
previous_attendance = 35 + 65 * rng.beta(5, 2, N_STUDENTS)

internal_marks = 20 + 80 * rng.beta(3, 2, N_STUDENTS)

assignment_submission_rate = (
    20 + 80 * rng.beta(4, 2, N_STUDENTS)
)

study_hours = 12 * rng.beta(2, 2, N_STUDENTS)

late_arrivals = np.clip(
    rng.poisson(lam=3, size=N_STUDENTS),
    0,
    50,
).astype(int)

previous_gpa = 10 * rng.beta(3, 2, N_STUDENTS)

distance_from_college = np.clip(
    rng.exponential(scale=12, size=N_STUDENTS),
    0,
    100,
)

extracurricular = rng.binomial(
    n=1,
    p=0.45,
    size=N_STUDENTS,
).astype(int)


# ---------------------------------------------------------
# Build the dataset using the exact contract column names
# ---------------------------------------------------------
df = pd.DataFrame(
    {
        "previous_attendance": previous_attendance,
        "internal_marks": internal_marks,
        "assignment_submission_rate": assignment_submission_rate,
        "study_hours": study_hours,
        "late_arrivals": late_arrivals,
        "previous_gpa": previous_gpa,
        "distance_from_college": distance_from_college,
        "extracurricular": extracurricular,
    }
)


# ---------------------------------------------------------
# Attendance target: weighted feature formula + Gaussian noise
# ---------------------------------------------------------
# Standardize features so weights represent relative influence.
# Previous attendance is strongest; late arrivals and distance
# have negative effects.
feature_weights = {
    "previous_attendance": 5.0,
    "internal_marks": 2.0,
    "assignment_submission_rate": 2.0,
    "study_hours": 2.5,
    "late_arrivals": -3.0,
    "previous_gpa": 1.0,
    "distance_from_college": -2.5,
    "extracurricular": 0.5,
}

weighted_score = np.zeros(N_STUDENTS, dtype=float)

for feature, weight in feature_weights.items():
    values = df[feature].astype(float)
    std = values.std(ddof=0)

    if std > 0:
        standardized = (values - values.mean()) / std
    else:
        standardized = np.zeros(N_STUDENTS)

    weighted_score += weight * standardized


# Gaussian noise adds variation not explained by the features.
noise = rng.normal(loc=0.0, scale=5.0, size=N_STUDENTS)

# Choose the intercept so the un-clipped target has mean 78.
intercept = 78.0 - np.mean(weighted_score + noise)

attendance = intercept + weighted_score + noise

# Keep attendance within the required range.
df["attendance"] = np.clip(attendance, 30.0, 100.0)

# Round numeric values for a clean CSV.
df = df.round(2)

# Preserve integer types for integer/binary contract fields.
df["late_arrivals"] = df["late_arrivals"].astype(int)
df["extracurricular"] = df["extracurricular"].astype(int)


# ---------------------------------------------------------
# Save CSV
# ---------------------------------------------------------
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(OUTPUT_PATH, index=False)


# ---------------------------------------------------------
# Report dataset statistics
# ---------------------------------------------------------
print("=" * 60)
print("STUDENT ATTENDANCE DATASET GENERATED")
print("=" * 60)

print(f"\nOutput file: {OUTPUT_PATH}")
print(f"Dataset shape: {df.shape}")
print(f"Number of students: {len(df)}")

print("\nAttendance statistics:")
print(df["attendance"].describe().round(2))

at_risk = df["attendance"] < 75
not_at_risk = ~at_risk

print("\nClass balance:")
print(
    f"At risk (<75%): {at_risk.sum()} "
    f"({at_risk.mean() * 100:.2f}%)"
)
print(
    f"Not at risk (>=75%): {not_at_risk.sum()} "
    f"({not_at_risk.mean() * 100:.2f}%)"
)

near_threshold = (
    (df["attendance"] > 74)
    & (df["attendance"] < 76)
)

print(
    "\nAttendance values strictly between 74% and 76%: "
    f"{near_threshold.sum()} ({near_threshold.mean() * 100:.2f}%)"
)

print("\nFeature correlations with attendance:")
print(
    df.corr(numeric_only=True)["attendance"]
    .drop("attendance")
    .sort_values(key=lambda x: x.abs(), ascending=False)
    .round(3)
)

print("\nMissing values:")
print(df.isnull().sum())

print("\nDataset generation completed successfully.")
