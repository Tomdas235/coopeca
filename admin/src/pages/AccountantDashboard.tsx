import { useState, useEffect, useCallback } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getBranches } from '../services/auth'
import { FinancialSummary, ReconciliationReport, ReconciliationReportItem } from '../types/api'

function formatXaf(value: string): string {
  const num = parseInt(value, 10)
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA'
}

export default function AccountantDashboard() {
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [report, setReport] = useState<ReconciliationReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportPage, setReportPage] = useState(1)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const brs = await getBranches()
      setBranches(brs)

      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate + 'T23:59:59').toISOString())
      if (selectedBranch) params.append('branchId', selectedBranch)

      const summaryResp = await api.get<FinancialSummary>('/financial-summary?' + params.toString())
      setSummary(summaryResp.data)

      if (showReport) {
        params.append('page', String(reportPage))
        params.append('limit', '20')
        const reportResp = await api.get<ReconciliationReport>('/reconciliation-report?' + params.toString())
        setReport(reportResp.data)
      }
    } catch (err: any) {
      setError(apiErrorToMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate, selectedBranch, showReport, reportPage])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading && !summary) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Chargement</span>
      </div>
    )
  }

  if (error && !summary) {
    return <div className="empty-state"><p>{error}</p></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Espace comptable</h1>
        <p>Vue financiere et rapprochement des cycles</p>
        <button className="btn-primary" onClick={loadData} disabled={isLoading}>
          {isLoading ? 'Chargement' : 'Recharger'}
        </button>
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

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Synthese des cycles</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="badge badge-success">Actifs: {summary.summary.activeCycles}</span>
              <span className="badge badge-info">Completes: {summary.summary.completedCycles}</span>
              <span className="badge badge-warning">Suspendus: {summary.summary.suspendedCycles}</span>
              <span className="badge badge-error">Clotures: {summary.summary.closedCycles}</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Rapprochement detaille</h2>
            <button className="btn-secondary" onClick={() => setShowReport(true)}>Afficher le rapport</button>
            {showReport && report && (
              <div style={{ marginTop: '1rem' }}>
                {report.items.length === 0 ? (
                  <div className="empty-state"><p>Aucun cycle.</p></div>
                ) : (
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
                        {report.items.map((item: ReconciliationReportItem) => (
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
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!summary && !isLoading && (
        <div className="empty-state">
          <p>Aucune donnee financiere disponible.</p>
        </div>
      )}
    </div>
  )
}