import {
  mockPredictResponse,
  mockBatchResponse,
  mockStudentsResponse,
  mockMetricsResponse,
  mockFeatureImportanceResponse,
} from "../mock/mockData";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const MOCK_DELAY = 300;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    if (response.status === 400 || response.status === 422) {
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function predict(studentData) {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    return mockPredictResponse;
  }

  const response = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });
  return handleResponse(response);
}

export async function predictBatch(file) {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    return mockBatchResponse;
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/api/predict/batch`, {
    method: "POST",
    body: formData,
  });
  const data = await handleResponse(response);
  const results = data.results ?? data.predictions ?? [];
  return { count: data.count ?? results.length, results };
}

export async function getStudents() {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    return mockStudentsResponse;
  }

  const response = await fetch(`${API_BASE}/api/students`);
  return handleResponse(response);
}

export async function getMetrics() {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    return mockMetricsResponse;
  }

  const response = await fetch(`${API_BASE}/api/metrics`);
  return handleResponse(response);
}

export async function getFeatureImportance() {
  if (USE_MOCK) {
    await delay(MOCK_DELAY);
    return mockFeatureImportanceResponse;
  }

  const response = await fetch(`${API_BASE}/api/feature-importance`);
  return handleResponse(response);
}