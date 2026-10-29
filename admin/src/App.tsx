import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { loadToken, clearToken, getProfile } from './services/auth'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Cycles from './pages/Cycles'
import Remittances from './pages/Remittances'
import Markets from './pages/Markets'
import Health from './pages/Health'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function initAuth() {
      try {
        const token = loadToken()
        if (token) {
          await getProfile()
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch {
        clearToken()
        setIsAuthenticated(false)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    initAuth()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="btn-primary" style={{ pointerEvents: 'none', opacity: 0.6 }}>Chargement…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
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
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App