import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'

interface HealthStatus {
  status: string
  [key: string]: any
}

export default function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadHealth() {
      try {
        const response = await api.get<HealthStatus>('/health')
        if (mounted) setHealth(response.data)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadHealth()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Santé de l'API</h1>
        <p>Monitoring du backend COOPECA</p>
      </div>
      <div className="card">
        <h2>Statut global</h2>
        <div className="health-status">
          <span className={`badge ${health?.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
            {health?.status === 'ok' ? 'Opérationnel' : 'Dégradé'}
          </span>
        </div>
        <h2>Détails</h2>
        <pre className="health-json">{JSON.stringify(health, null, 2)}</pre>
      </div>
    </div>
  )
}