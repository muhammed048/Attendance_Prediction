\# Student Attendance Prediction



Web app that predicts a student's attendance percentage and risk level

(Low / Medium / High) from academic and behavioural features.



\## Features

\- Single student prediction with top contributing factors

\- Batch prediction from a CSV file

\- Students list with search, filter and risk summary

\- Model insights: metrics, confusion matrix, feature importance



\## Tech Stack

\- \*\*Backend:\*\* FastAPI, scikit-learn (RandomForest and others)

\- \*\*Frontend:\*\* React, Vite, React Router, Recharts, Tailwind CSS



\## Project Structure

```

backend/   FastAPI app, ML training code, data, models

frontend/  React + Vite app

```



\## Run the Backend

```bash

cd backend

python -m venv venv

venv\\Scripts\\activate

pip install -r requirements.txt

python ml/train.py        # only if models/ is empty

uvicorn app.main:app --reload --port 8000

```

API docs: http://localhost:8000/docs



\## Run the Frontend

```bash

cd frontend

npm install

npm run dev

```

Open http://localhost:5173. Set `VITE\_USE\_MOCK=true` in `frontend/.env`

to run with mock data when the backend is not running.



\## API Endpoints

| Method | Path | Purpose |

|---|---|---|

| POST | /api/predict | Predict for one student |

| POST | /api/predict/batch | Predict from a CSV upload |

| GET | /api/students | List predicted students |

| GET | /api/metrics | Model metrics |

| GET | /api/feature-importance | Feature importance |



\## Team

\- Backend / ML: <name>

\- Frontend: <name>

