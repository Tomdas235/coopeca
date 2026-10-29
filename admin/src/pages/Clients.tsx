import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { ClientListItem } from '../types/api'

export default function Clients() {
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadClients() {
      try {
        const response = await api.get<{ items: ClientListItem[]; meta: any }>('/clients')
        if (mounted) setClients(response.data.items)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadClients()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clients</h1>
        <p>Gestion des clients de tontine</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Agence</th>
              <th>Marché</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan="6" className="empty-cell">Aucun client trouvé.</td></tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.clientCode}</td>
                  <td>{c.fullName}</td>
                  <td><span className="badge badge-info">{c.status}</span></td>
                  <td>{c.branchId || '—'}</td>
                  <td>{c.marketId || '—'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}