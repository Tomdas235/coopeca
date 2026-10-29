import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { TontineCycle } from '../types/api'

export default function Cycles() {
  const [cycles, setCycles] = useState<TontineCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadCycles() {
      try {
        const response = await api.get<{ items: TontineCycle[]; meta: any }>('/tontine-cycles')
        if (mounted) setCycles(response.data.items)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadCycles()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cycles de tontine</h1>
        <p>Suivi des cycles à 31 versements</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID du cycle</th>
              <th>Statut</th>
              <th>Montant fixe (XAF)</th>
              <th>Versements</th>
              <th>Total collecté</th>
              <th>Solde disponible</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr><td colSpan="7" className="empty-cell">Aucun cycle trouvé.</td></tr>
            ) : (
              cycles.map((c) => (
                <tr key={c.id}>
                  <td>{c.id.slice(-8)}</td>
                  <td><span className="badge badge-info">{c.status}</span></td>
                  <td><span className="amount-xaf">{c.fixedAmountXaf}</span></td>
                  <td>{c.installmentCount} / {c.targetInstallments}</td>
                  <td><span className="amount-xaf">{c.totalCollectedXaf}</span></td>
                  <td><span className="amount-xaf">{c.availableBalanceXaf}</span></td>
                  <td><span className={`badge ${c.commissionPaid ? 'badge-success' : 'badge-warning'}`}>{c.commissionPaid ? 'Payée' : 'En attente'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}