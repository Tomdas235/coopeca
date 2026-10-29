import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'

export interface WithdrawalRequest {
  id: string
  cycleId: string
  requestedByAgentId: string
  requestedByAgentName?: string
  amountXaf: string
  closesCycle: boolean
  status: string
  reason?: string
  rejectionReason?: string | null
  requestedAt: string
  reviewedAt: string | null
}

export default function WithdrawalsPending() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadWithdrawals() {
      try {
        const response = await api.get<{ items: WithdrawalRequest[]; meta: any }>('/withdrawals/pending')
        if (mounted) setWithdrawals(response.data.items)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadWithdrawals()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className=\"loading-container\"><div className=\"spinner\"></div><span className=\"loading-text\">Chargement…</span></div>
  }
  if (error) return <div className=\"empty-state\"><p>{error}</p></div>

  return (
    <div className=\"page\">
      <div className=\"page-header\">
        <h1>Demandes de retrait en attente</h1>
        <p>File de vérification SUPERVISOR</p>
      </div>

      <div className=\"table-container\">
        <table className=\"table\">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cycle</th>
              <th>Agent demandeur</th>
              <th>Montant</th>
              <th>Clôture cycle</th>
              <th>Demandé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr><td colSpan={7} className=\"empty-cell\">Aucune demande de retrait en attente.</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{w.id.slice(-8)}</td>
                  <td>{w.cycleId.slice(-8)}</td>
                  <td>{w.requestedByAgentName || '—'}</td>
                  <td><span className=\"amount-xaf\">{w.amountXaf}</span></td>
                  <td>{w.closesCycle ? 'Oui' : 'Non'}</td>
                  <td>{new Date(w.requestedAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button className=\"btn-small btn-warning\">Examiner</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}