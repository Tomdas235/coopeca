import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getBranches } from '../services/auth'
import { FinancialSummary, ReconciliationReport } from '../types/api'

function formatXaf(value: string): string {
  const num = parseInt(value, 10)
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA'
}

export default function AuditorDashboard() {
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [report, setReport] = useState<ReconciliationReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const brs = await getBranches()
        if (mounted) setBranches(brs)

        const params = new URLSearchParams()
        if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
        if (toDate) params.append('toDate', new Date(toDate + 'T23:59:59').toISOString())
        if (selectedBranch) params.append('branchId', selectedBranch)

        const summaryResp = await api.get<FinancialSummary>('/financial-summary?' + params.toString())
        if (mounted) setSummary(summaryResp.data)

        params.append('page', '1')
        params.append('limit', '20')
        const reportResp = await api.get<ReconciliationReport>('/reconciliation-report?' + params.toString())
        if (mounted) setReport(reportResp.data)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [fromDate, toDate, selectedBranch])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement</span></div>
  }
  if (error) {
    return <div className="empty-state"><p>{error}</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Espace auditeur</h1>
        <p>Controle et audit (lecture seule)</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Periode du</label>
            <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Au</label>
            <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Agence</label>
            <select className="form-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="">Toutes les agences</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {summary && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Cycles total</div>
              <div className="stat-value">{summary.summary.totalCycles}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cotisations</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalCollectedXaf)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retraits</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalWithdrawnXaf)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Commissions</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalCommissionXaf)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Solde disponible</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalAvailableBalanceXaf)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retraits en attente</div>
              <div className="stat-value">{summary.summary.pendingWithdrawals}</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Rapport de rapprochement</h2>
            {report && report.items.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Agence</th>
                      <th>Statut</th>
                      <th>Versements</th>
                      <th>Cotisations</th>
                      <th>Retraits</th>
                      <th>Commissions</th>
                      <th>Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={item.cycleId}>
                        <td>{item.clientName}</td>
                        <td>{item.branchCode}</td>
                        <td>{item.status}</td>
                        <td>{item.installmentCount}/{item.targetInstallments}</td>
                        <td className="amount-xaf">{formatXaf(item.totalDepositedXaf)}</td>
                        <td className="amount-xaf">{formatXaf(item.totalWithdrawnXaf)}</td>
                        <td className="amount-xaf">{formatXaf(item.totalCommissionXaf)}</td>
                        <td className="amount-xaf">{formatXaf(item.availableBalanceXaf)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>Aucune donnee.</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}