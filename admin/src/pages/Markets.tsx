import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { Market } from '../types/api'

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadMarkets() {
      try {
        const response = await api.get<Market[]>('/markets')
        if (mounted) setMarkets(response.data)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadMarkets()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Marchés</h1>
        <p>Gestion des marchés autonomes</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {markets.length === 0 ? (
              <tr><td colSpan={4} className="empty-cell">Aucun marché trouvé.</td></tr>
            ) : (
              markets.map((m) => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td>{m.name}</td>
                  <td><span className={`badge ${m.isActive ? 'badge-success' : 'badge-error'}`}>{m.isActive ? 'Actif' : 'Inactif'}</span></td>
                  <td>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}