import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import PredictPage from './pages/PredictPage.jsx'
import BatchPage from './pages/BatchPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PredictPage />} />
        <Route path="batch" element={<BatchPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="insights" element={<InsightsPage />} />
      </Route>
    </Routes>
  )
}

export default App