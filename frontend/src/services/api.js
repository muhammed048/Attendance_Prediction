const API_BASE = 'http://localhost:8000'

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export async function predictAttendance(student) {
  const { name, roll_no, ...features } = student
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  })
  const data = await handleResponse(response)
  return {
    name: data.name ?? name ?? 'Unknown',
    roll_no: data.roll_no ?? roll_no ?? 'N/A',
    ...data,
  }
}

export async function predictBatch(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/api/predict/batch`, {
    method: 'POST',
    body: formData,
  })
  const data = await handleResponse(response)
  // Compat shim: backend returns 'predictions', contract says 'results'
  // TODO: Remove when backend aligns with contract
  const results = data.results ?? data.predictions ?? []
  return { count: data.count ?? results.length, results }
}

export async function getStudents() {
  const response = await fetch(`${API_BASE}/api/students`)
  const data = await handleResponse(response)
  // Transform DB records to contract shape
  const students = (data.students ?? []).map((record) => {
    const input = record.input_data ?? {}
    return {
      name: input.name ?? 'Unknown',
      roll_no: input.roll_no ?? 'N/A',
      predicted_attendance: record.predicted_attendance,
      risk_level: record.risk_level,
      top_factors: record.top_factors,
    }
  })
  return { students }
}

export async function getMetrics() {
  const response = await fetch(`${API_BASE}/api/metrics`)
  return handleResponse(response)
}

export async function getFeatureImportance() {
  const response = await fetch(`${API_BASE}/api/feature-importance`)
  const data = await handleResponse(response)
  // Backend returns { features: [...] } per contract
  return data.features ?? data
}