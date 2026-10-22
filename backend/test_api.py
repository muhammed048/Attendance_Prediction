
import json
import urllib.error
import urllib.request


BASE_URL = "http://127.0.0.1:8000"

SAMPLE_STUDENT = {
    "previous_attendance": 80,
    "internal_marks": 75,
    "assignment_submission_rate": 90,
    "study_hours": 5,
    "late_arrivals": 2,
    "previous_gpa": 8,
    "distance_from_college": 10,
    "extracurricular": 1,
}


def request_api(path, method="GET", data=None):
    """Send an HTTP request and print the response."""
    body = None

    headers = {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(
        BASE_URL + path,
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(f"\n{method} {path} -> {response.status}")
            print(json.dumps(result, indent=2))
            return result

    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8")
        print(f"\n{method} {path} -> {error.code}")
        print(message)
        return None


def main():
    print("Testing Student Attendance Prediction API")

    # Check that the API is running.
    request_api("/")

    # Test a single prediction.
    prediction = request_api(
        "/api/predict",
        method="POST",
        data=SAMPLE_STUDENT,
    )

    if prediction:
        assert "predicted_attendance" in prediction
        assert prediction["risk_level"] in ["Low", "Medium", "High"]
        assert len(prediction["top_factors"]) == 3
        print("\nSingle prediction test passed.")

    # Check the saved prediction history.
    request_api("/api/students")

    # Check model evaluation metrics.
    request_api("/api/metrics")

    # Check feature importance.
    request_api("/api/feature-importance")

    # Verify invalid input returns HTTP 422.
    invalid_student = SAMPLE_STUDENT.copy()
    invalid_student["previous_attendance"] = 150

    request_api(
        "/api/predict",
        method="POST",
        data=invalid_student,
    )

    print("\nAPI tests finished.")


if __name__ == "__main__":
    main()
