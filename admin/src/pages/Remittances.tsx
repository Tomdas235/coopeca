import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { Remittance } from '../types/api'

export default function Remittances() {
  const [remittances, setRemittances] = useState<Remittance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadRemittances() {
      try {
        const response = await api.get<{ items: Remittance[]; meta: any }>('/remittances')
        if (mounted) setRemittances(response.data.items)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadRemittances()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Remises de fonds</h1>
        <p>Suivi des déclarations de remise agent → caisse</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Statut</th>
              <th>Montant déclaré (XAF)</th>
              <th>Agence</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {remittances.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">Aucune remise trouvée.</td></tr>
            ) : (
              remittances.map((r) => (
                <tr key={r.id}>
                  <td>{r.remittanceNo}</td>
                  <td><span className="badge badge-info">{r.status}</span></td>
                  <td><span className="amount-xaf">{r.declaredTotalXaf}</span></td>
                  <td>{r.branchId.slice(-8)}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}