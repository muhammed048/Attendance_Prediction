
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    """Validate a single student's prediction input."""

    model_config = ConfigDict(extra="forbid")

    previous_attendance: float = Field(ge=0, le=100)
    internal_marks: float = Field(ge=0, le=100)
    assignment_submission_rate: float = Field(ge=0, le=100)
    study_hours: float = Field(ge=0, le=12)
    late_arrivals: int = Field(ge=0, le=50)
    previous_gpa: float = Field(ge=0, le=10)
    distance_from_college: float = Field(ge=0, le=100)
    extracurricular: Literal[0, 1]


class TopFactor(BaseModel):
    """One factor influencing the predicted attendance."""

    feature: str
    impact: float


class PredictionResponse(BaseModel):
    """Exact response structure for a single prediction."""

    predicted_attendance: float = Field(ge=0, le=100)
    risk_level: Literal["Low", "Medium", "High"]
    top_factors: list[TopFactor] = Field(min_length=3, max_length=3)
