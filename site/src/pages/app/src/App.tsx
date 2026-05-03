import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'

// Simple dashboard placeholder — the real dashboard is in the user's app
function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-manrope font-semibold text-white mb-4">Tableau de bord</h1>
        <p className="text-white/60 font-manrope">Le tableau de bord complet est disponible dans l'application principale.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
    </Routes>
  )
}
