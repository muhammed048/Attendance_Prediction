"""
Train regression and classification models for
Student Attendance Prediction.

Input:
    backend/data/students.csv

Outputs:
    backend/models/best_model.joblib
    backend/models/metrics.json
    backend/models/feature_importance.json

The saved regression model is a scikit-learn Pipeline.
It includes preprocessing and the trained estimator.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
    GradientBoostingRegressor,
)
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# --------------------------------------------------
# 1. Configure paths and constants
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = BACKEND_DIR / "data" / "students.csv"

MODELS_DIR = BACKEND_DIR / "models"

BEST_MODEL_FILE = MODELS_DIR / "best_model.joblib"

METRICS_FILE = MODELS_DIR / "metrics.json"

FEATURE_IMPORTANCE_FILE = (
    MODELS_DIR / "feature_importance.json"
)

RANDOM_SEED = 42

TEST_SIZE = 0.20

AT_RISK_THRESHOLD = 75.0

MODELS_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# 2. Define the exact contract feature names
# --------------------------------------------------

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

TARGET = "attendance"


# --------------------------------------------------
# 3. Load and validate the dataset
# --------------------------------------------------

if not DATA_FILE.exists():
    raise FileNotFoundError(
        f"Dataset not found: {DATA_FILE}\n"
        "Run ml/generate_data.py first."
    )

df = pd.read_csv(DATA_FILE)

required_columns = FEATURES + [TARGET]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Dataset is missing required columns: "
        f"{missing_columns}"
    )

# Ignore unrelated columns if the CSV contains any.
df = df[required_columns].copy()

# Remove duplicate records.
df = df.drop_duplicates().reset_index(drop=True)

if len(df) < 20:
    raise ValueError(
        "At least 20 valid rows are required for training."
    )

# Ensure that all contract features and the target
# contain numerical values.
for column in required_columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )

# Missing target values cannot be imputed reliably
# without inventing the value the model must predict.
df = df.dropna(subset=[TARGET]).reset_index(drop=True)

# Discard invalid target values.
df = df[
    df[TARGET].between(0, 100)
].reset_index(drop=True)

if len(df) < 20:
    raise ValueError(
        "Not enough valid rows remain after data cleaning."
    )

# Enforce the contractual bounds for input features.
feature_bounds = {
    "previous_attendance": (0, 100),
    "internal_marks": (0, 100),
    "assignment_submission_rate": (0, 100),
    "study_hours": (0, 12),
    "late_arrivals": (0, 50),
    "previous_gpa": (0, 10),
    "distance_from_college": (0, 100),
    "extracurricular": (0, 1),
}

# Invalid feature values are replaced with missing values.
# The preprocessing pipeline will impute them using
# statistics learned from the training split.
for column, (minimum, maximum) in feature_bounds.items():
    invalid_mask = ~df[column].between(minimum, maximum)

    df.loc[invalid_mask, column] = np.nan

# These two fields must be integers.
for column in ["late_arrivals", "extracurricular"]:
    values = df[column]

    df.loc[
        values.notna() & (values != np.floor(values)),
        column
    ] = np.nan

# Extracurricular participation must be binary.
df.loc[
    ~df["extracurricular"].isin([0, 1])
    & df["extracurricular"].notna(),
    "extracurricular"
] = np.nan

print("=" * 65)
print("STUDENT ATTENDANCE PREDICTION - MODEL TRAINING")
print("=" * 65)

print(f"\nValid records: {len(df)}")
print(f"Input features: {len(FEATURES)}")



# --------------------------------------------------
# 4. Split features and target
# --------------------------------------------------

X = df[FEATURES].copy()
y = df[TARGET].copy()

# Classification label:
# 1 = at risk, attendance below 75%
# 0 = not at risk, attendance at least 75%
y_class = (y < AT_RISK_THRESHOLD).astype(int)

print("\nOverall class balance:")
print(
    y_class.map({
        0: "Not at risk",
        1: "At risk"
    }).value_counts()
)

print("\nOverall class percentages:")
print(
    (
        y_class.value_counts(normalize=True)
        .mul(100)
        .rename(index={
            0: "Not at risk",
            1: "At risk"
        })
        .round(2)
    )
)

# Stratify using the classification labels so that
# both partitions retain approximately the same
# proportion of at-risk and not-at-risk students.
(
    X_train,
    X_test,
    y_train,
    y_test,
    y_class_train,
    y_class_test,
) = train_test_split(
    X,
    y,
    y_class,
    test_size=TEST_SIZE,
    random_state=RANDOM_SEED,
    stratify=y_class,
)

print("\nTraining-set class balance:")
print(y_class_train.value_counts().sort_index())

print("\nTest-set class balance:")
print(y_class_test.value_counts().sort_index())


# --------------------------------------------------
# 5. Preprocessing
# --------------------------------------------------

# All eight inputs are numeric.
#
# Missing numerical values are filled using the median
# calculated from the training data.
#
# StandardScaler helps LinearRegression by putting
# features on comparable scales.
#
# Tree-based models do not require feature scaling,
# but the same preprocessing approach is used for a
# consistent and convenient saved pipeline.

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            Pipeline(
                steps=[
                    (
                        "imputer",
                        SimpleImputer(strategy="median"),
                    ),
                    (
                        "scaler",
                        StandardScaler(),
                    ),
                ]
            ),
            FEATURES,
        )
    ],
    remainder="drop",
)


# --------------------------------------------------
# 6. Correlation-based feature analysis
# --------------------------------------------------

# Calculate correlations using training data only.
#
# Pandas calculates Pearson correlation coefficients.
# A value near +1 indicates a positive linear
# relationship; a value near -1 indicates a negative
# linear relationship.

correlation_df = X_train.copy()

correlation_df[TARGET] = y_train

correlations = (
    correlation_df
    .corr(numeric_only=True)[TARGET]
    .drop(TARGET)
)

correlations = correlations.reindex(FEATURES)

print("\nFeature correlations with attendance:")
print(
    correlations.sort_values(
        key=lambda values: values.abs(),
        ascending=False
    ).round(4)
)


# --------------------------------------------------
# 7. Feature selection using correlation and importance
# --------------------------------------------------

# First, calculate feature importance using a separate
# Random Forest fitted only on the training partition.
#
# Median imputation is applied before fitting because
# Random Forest does not accept NaN values in these
# inputs.

importance_preprocessor = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median"),
        )
    ]
)

X_train_imputed = pd.DataFrame(
    importance_preprocessor.fit_transform(X_train),
    columns=FEATURES,
    index=X_train.index,
)

selection_forest = RandomForestRegressor(
    n_estimators=200,
    random_state=RANDOM_SEED,
    n_jobs=-1,
)

selection_forest.fit(
    X_train_imputed,
    y_train,
)

forest_importances = pd.Series(
    selection_forest.feature_importances_,
    index=FEATURES,
)

# Combine two sources of information:
# 1. Absolute Pearson correlation.
# 2. Random Forest feature importance.
#
# Both components are normalized to a comparable
# range before calculating the combined score.

absolute_correlations = correlations.abs().fillna(0)

if absolute_correlations.max() > 0:
    normalized_correlations = (
        absolute_correlations
        / absolute_correlations.max()
    )
else:
    normalized_correlations = absolute_correlations

if forest_importances.max() > 0:
    normalized_importances = (
        forest_importances
        / forest_importances.max()
    )
else:
    normalized_importances = forest_importances

combined_scores = (
    0.5 * normalized_correlations
    + 0.5 * normalized_importances
)

# Keep features with a combined score of at least 10%
# of the highest-scoring feature.
#
# Always retain at least the three highest-scoring
# features to avoid an excessively small feature set.

selection_threshold = 0.10 * combined_scores.max()

selected_features = combined_scores[
    combined_scores >= selection_threshold
].index.tolist()

selected_features = [
    feature
    for feature in FEATURES
    if feature in selected_features
]

if len(selected_features) < min(3, len(FEATURES)):
    selected_features = (
        combined_scores
        .sort_values(ascending=False)
        .head(min(3, len(FEATURES)))
        .index.tolist()
    )

# Restore the original contract feature order.
selected_features = [
    feature
    for feature in FEATURES
    if feature in selected_features
]

print("\nSelected features:")
for feature in selected_features:
    print(
        f"  {feature}: "
        f"correlation={correlations[feature]:.4f}, "
        f"importance={forest_importances[feature]:.4f}"
    )

print(
    f"\nSelected {len(selected_features)} "
    f"out of {len(FEATURES)} features."
)


# --------------------------------------------------
# 8. Create the regression model pipelines
# --------------------------------------------------

# The preprocessor imputes missing values and scales
# the selected features.
#
# SelectKBest provides an additional statistical
# feature-selection step inside each model pipeline.
#
# Its parameters are learned from the training split
# only because it is fitted inside the pipeline.

def create_pipeline(estimator):
    """Build a complete preprocessing and regression pipeline."""

    model_preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        (
                            "imputer",
                            SimpleImputer(strategy="median"),
                        ),
                        (
                            "scaler",
                            StandardScaler(),
                        ),
                    ]
                ),
                selected_features,
            )
        ],
        remainder="drop",
    )

    return Pipeline(
        steps=[
            ("preprocessor", model_preprocessor),
            (
                "feature_selection",
                SelectKBest(
                    score_func=f_regression,
                    k="all",
                ),
            ),
            ("regressor", estimator),
        ]
    )


regression_models = {
    "LinearRegression": LinearRegression(),

    "RandomForest": RandomForestRegressor(
        n_estimators=300,
        random_state=RANDOM_SEED,
        min_samples_leaf=2,
        n_jobs=-1,
    ),

    "GradientBoosting": GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=RANDOM_SEED,
    ),
}


# --------------------------------------------------
# 9. Train and evaluate regression models
# --------------------------------------------------

regression_results = []

trained_models = {}

for model_name, estimator in regression_models.items():

    print(f"\nTraining {model_name}...")

    pipeline = create_pipeline(estimator)

    pipeline.fit(
        X_train,
        y_train,
    )

    predictions = pipeline.predict(X_test)

    # Attendance is a percentage.
    # Restrict predictions to the valid range.
    predictions = np.clip(
        predictions,
        0,
        100,
    )

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    mse = mean_squared_error(
        y_test,
        predictions,
    )

    rmse = float(np.sqrt(mse))

    r2 = r2_score(
        y_test,
        predictions,
    )

    result = {
        "model": model_name,
        "mae": round(float(mae), 4),
        "mse": round(float(mse), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2), 4),
    }

    regression_results.append(result)

    trained_models[model_name] = pipeline

    print(f"  MAE:  {mae:.4f}")
    print(f"  MSE:  {mse:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  R2:   {r2:.4f}")


# --------------------------------------------------
# 10. Select the best regression model
# --------------------------------------------------

# MAE is the primary selection metric.
# Lower MAE means lower average absolute prediction error.

best_result = min(
    regression_results,
    key=lambda result: result["mae"],
)

best_model_name = best_result["model"]

best_model = trained_models[best_model_name]

print("\nBest regression model:", best_model_name)


# --------------------------------------------------
# 11. Save the best regression model
# --------------------------------------------------

# The entire pipeline is saved, including preprocessing
# and feature-selection steps.
#
# The API can later load this file and pass a DataFrame
# containing the original eight contract features.

joblib.dump(
    best_model,
    BEST_MODEL_FILE,
)

print(f"Saved best model: {BEST_MODEL_FILE}")


# --------------------------------------------------
# 12. Classification: identify at-risk students
# --------------------------------------------------

# Classification target:
# 1 = attendance below 75%
# 0 = attendance at least 75%

# The classifier uses only selected features.
classifier_preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            Pipeline(
                steps=[
                    (
                        "imputer",
                        SimpleImputer(strategy="median"),
                    ),
                    (
                        "scaler",
                        StandardScaler(),
                    ),
                ]
            ),
            selected_features,
        )
    ],
    remainder="drop",
)

classifier = Pipeline(
    steps=[
        (
            "preprocessor",
            classifier_preprocessor,
        ),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=300,
                random_state=RANDOM_SEED,
                class_weight="balanced",
                n_jobs=-1,
            ),
        ),
    ]
)

classifier.fit(
    X_train,
    y_class_train,
)

class_predictions = classifier.predict(X_test)

accuracy = accuracy_score(
    y_class_test,
    class_predictions,
)

precision = precision_score(
    y_class_test,
    class_predictions,
    zero_division=0,
)

recall = recall_score(
    y_class_test,
    class_predictions,
    zero_division=0,
)

# Explicitly define label order so that the matrix
# always has two rows and two columns.
#
# Row order: actual 0, actual 1.
# Column order: predicted 0, predicted 1.
cm = confusion_matrix(
    y_class_test,
    class_predictions,
    labels=[0, 1],
)

print("\nClassification results:")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")

print("\nConfusion matrix:")
print(cm)


# --------------------------------------------------
# 13. Save metrics in the exact contract format
# --------------------------------------------------

# Keep the top-level keys and nested structure exactly
# as specified in CONTRACT.md.

metrics = {
    "best_model": best_model_name,

    "regression": regression_results,

    "classification": {
        "accuracy": round(float(accuracy), 4),

        "precision": round(float(precision), 4),

        "recall": round(float(recall), 4),

        "confusion_matrix": cm.tolist(),
    },
}

with open(
    METRICS_FILE,
    "w",
    encoding="utf-8",
) as file:
    json.dump(
        metrics,
        file,
        indent=4,
    )

print(f"\nSaved metrics: {METRICS_FILE}")


# --------------------------------------------------
# 14. Calculate final feature importance
# --------------------------------------------------

# The importance values are calculated from the best
# regression model.
#
# For tree-based models, use the estimator's native
# feature_importances_.
#
# For LinearRegression, use the absolute regression
# coefficients as a proxy, normalized to sum to one.

fitted_preprocessor = best_model.named_steps[
    "preprocessor"
]

fitted_selector = best_model.named_steps[
    "feature_selection"
]

fitted_estimator = best_model.named_steps[
    "regressor"
]

# Recover the feature names that survived SelectKBest.
selected_mask = fitted_selector.get_support()

pipeline_feature_names = np.array(
    selected_features
)

final_feature_names = pipeline_feature_names[
    selected_mask
]

if hasattr(fitted_estimator, "feature_importances_"):

    final_importances = fitted_estimator.feature_importances_

else:

    # Absolute coefficients provide a useful relative
    # measure for LinearRegression.
    final_importances = np.abs(
        fitted_estimator.coef_
    )

    total_importance = final_importances.sum()

    if total_importance > 0:
        final_importances = (
            final_importances / total_importance
        )

# Normalize importance values to sum to one.
total_importance = float(
    np.sum(final_importances)
)

if total_importance > 0:
    final_importances = (
        final_importances / total_importance
    )

importance_records = [
    {
        "feature": str(feature),
        "importance": round(
            float(importance),
            6,
        ),
    }
    for feature, importance in zip(
        final_feature_names,
        final_importances,
    )
]

# Sort by importance, highest first.
importance_records.sort(
    key=lambda item: item["importance"],
    reverse=True,
)

feature_importance_output = {
    "features": importance_records
}

with open(
    FEATURE_IMPORTANCE_FILE,
    "w",
    encoding="utf-8",
) as file:
    json.dump(
        feature_importance_output,
        file,
        indent=4,
    )

print(
    f"Saved feature importance: "
    f"{FEATURE_IMPORTANCE_FILE}"
)


# --------------------------------------------------
# 15. Final summary
# --------------------------------------------------

print("\n" + "=" * 65)
print("TRAINING COMPLETED SUCCESSFULLY")
print("=" * 65)

print(f"Best model: {best_model_name}")

print("\nGenerated files:")

print(f"  {BEST_MODEL_FILE}")

print(f"  {METRICS_FILE}")

print(f"  {FEATURE_IMPORTANCE_FILE}")

print("\nAll three regression models were evaluated.")

print("The classification model was evaluated.")

print("The trained model and evaluation results are ready.")