import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getBranches } from '../services/auth'

export default function CashierDashboard() {
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [remittances, setRemittances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [brs, remResp] = await Promise.all([
          getBranches(),
          api.get<{ items: any[]; meta: any }>('/remittances'),
        ])
        if (mounted) {
          setBranches(brs)
          setRemittances(remResp.data.items || [])
        }
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement</span></div>
  }
  if (error) {
    return <div className="empty-state"><p>{error}</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Espace caissier</h1>
        <p>Operations de caisse et remises</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Agences autorisees</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {branches.map((b) => (
            <span key={b.id} className="badge badge-primary">{b.code} - {b.name}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Remises de caisse ({remittances.length})</h2>
        {remittances.length === 0 ? (
          <div className="empty-state"><p>Aucune remise.</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Agent</th>
                  <th>Agence</th>
                  <th>Montant declare</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {remittances.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.remittanceNo}</td>
                    <td>{r.agent?.fullName || r.agentId}</td>
                    <td>{r.branch?.code || r.branchId}</td>
                    <td className="amount-xaf">{r.declaredTotalXaf}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
                    <td>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}