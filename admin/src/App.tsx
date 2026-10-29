import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { loadToken, clearToken, getProfile } from './services/auth'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Cycles from './pages/Cycles'
import Remittances from './pages/Remittances'
import Markets from './pages/Markets'
import Health from './pages/Health'
import WithdrawalsPending from './pages/WithdrawalsPending'
import AccountantDashboard from './pages/AccountantDashboard'
import CashierDashboard from './pages/CashierDashboard'
import AuditorDashboard from './pages/AuditorDashboard'

function AppContent() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function initAuth() {
      try {
        const token = loadToken()
        if (token) {
          await getProfile()
        }
      } catch {
        clearToken()
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    initAuth()
    return () => { mounted = false }
  }, [])

  const isAuthenticated = !!loadToken()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="btn-primary" style={{ pointerEvents: 'none', opacity: 0.6 }}>Chargement…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="cycles" element={<Cycles />} />
                <Route path="remittances" element={<Remittances />} />
                <Route path="markets" element={<Markets />} />
                <Route path="health" element={<Health />} />
                <Route path="withdrawals" element={<WithdrawalsPending />} />
                <Route path="accountant" element={<AccountantDashboard />} />
                <Route path="cashier" element={<CashierDashboard />} />
                <Route path="auditor" element={<AuditorDashboard />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App