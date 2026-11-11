import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { loadToken, clearToken } from './services/auth'
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
import Agents from './pages/Agents'
import Branches from './pages/Branches'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminPage } from './config/permissions'

function RequireRole({ page, children }: { page: AdminPage; children: JSX.Element }) {
  const { isLoading, isAuthenticated, hasPermission } = useAuth()
  const navigate = useNavigate()

  if (isLoading || !isAuthenticated) {
    return null
  }
  if (!hasPermission(page)) {
    navigate('/', { replace: true })
    return null
  }
  return children
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function initAuth() {
      try {
        const token = loadToken()
        if (token) {
          // Valide le token côté serveur ; le profil est rechargé dans AuthProvider.
          await fetch(`${import.meta.env.BASE_URL}api/v1/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { clearToken() })
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
    <AuthProvider>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Routes>
                  <Route path="/" element={<RequireRole page="" children={<Dashboard />} />} />
                  <Route path="clients" element={<RequireRole page="clients" children={<Clients />} />} />
                  <Route path="agents" element={<RequireRole page="agents" children={<Agents />} />} />
                  <Route path="branches" element={<RequireRole page="branches" children={<Branches />} />} />
                  <Route path="cycles" element={<RequireRole page="cycles" children={<Cycles />} />} />
                  <Route path="remittances" element={<RequireRole page="remittances" children={<Remittances />} />} />
                  <Route path="markets" element={<RequireRole page="markets" children={<Markets />} />} />
                  <Route path="health" element={<RequireRole page="health" children={<Health />} />} />
                  <Route path="withdrawals" element={<RequireRole page="withdrawals" children={<WithdrawalsPending />} />} />
                  <Route path="accountant" element={<RequireRole page="accountant" children={<AccountantDashboard />} />} />
                  <Route path="cashier" element={<RequireRole page="cashier" children={<CashierDashboard />} />} />
                  <Route path="auditor" element={<RequireRole page="auditor" children={<AuditorDashboard />} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </AuthProvider>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
