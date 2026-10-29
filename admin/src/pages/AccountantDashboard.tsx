import { useState, useEffect, useCallback } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getProfile, getBranches } from '../services/auth'
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
      const [prof, brs] = await Promise.all([getProfile(), getBranches()])
      setBranches(brs)

      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate + 'T23:59:59').toISOString())
      if (selectedBranch) params.append('branchId', selectedBranch)

      const summaryResp = await api.get<FinancialSummary>(`/financial-summary?${params.toString()}`)
      setSummary(summaryResp.data)

      if (showReport) {
        params.append('page', String(reportPage))
        params.append('limit', '20')
        const reportResp = await api.get<ReconciliationReport>(`/reconciliation-report?${params.toString()}`)
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

  const handleReload = () => {
    loadData()
  }

  const handleShowReport = () => {
    setShowReport(true)
    setReportPage(1)
  }

  if (isLoading && !summary) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Chargement…</span>
      </div>
    )
  }

  if (error && !summary) {
    return <div className="empty-state"><p>{error}</p></div>
  }


  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Espace comptable</h1>
          <p>Vue financière et rapprochement des cycles de tontine</p>
        </div>
        <button className="btn-primary" onClick={handleReload} disabled={isLoading}>
          {isLoading ? 'Chargement…' : 'Recharger'}
        </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Période du</label>
            <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Au</label>
            <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label">Agence</label>
            <select className="form-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="">Toutes les agences autorisées</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {summary && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Cycles total</div>
              <div className="stat-value">{summary.summary.totalCycles}</div>
              <div className="stat-sub">{summary.summary.activeCycles} actifs · {summary.summary.completedCycles} complétés</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cotisations enregistrées</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalCollectedXaf)}</div>
              <div className="stat-sub">Versements de cycle</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retraits</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalWithdrawnXaf)}</div>
              <div className="stat-sub">{summary.summary.approvedWithdrawals} approuvés</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Commissions perçues</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalCommissionXaf)}</div>
              <div className="stat-sub">1 versement par 1er retrait</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Solde disponible</div>
              <div className="stat-value amount-xaf">{formatXaf(summary.summary.totalAvailableBalanceXaf)}</div>
              <div className="stat-sub">Net après retraits et commissions</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retraits en attente</div>
              <div className="stat-value">{summary.summary.pendingWithdrawals}</div>
              <div className="stat-sub">{summary.summary.rejectedWithdrawals} rejetés</div>
            </div>
          </div>


          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Synthèse des cycles</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="badge badge-success">Actifs: {summary.summary.activeCycles}</span>
              <span className="badge badge-info">Complétés: {summary.summary.completedCycles}</span>
              <span className="badge badge-warning">Suspendus: {summary.summary.suspendedCycles}</span>
              <span className="badge badge-error">Clôturés: {summary.summary.closedCycles}</span>
            </div>
            {summary.branches.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>Agences incluses</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {summary.branches.map((b) => (
                    <span key={b.id} className="badge badge-primary">{b.code} — {b.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Rapprochement détaillé</h2>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                  Liste des cycles avec ventilation des montants par type d'écriture.
                </p>
              </div>
              {!showReport && (
                <button className="btn-secondary" onClick={handleShowReport}>Afficher le rapport détaillé</button>
              )}
            </div>

            {showReport && report && (
              <div style={{ marginTop: '1rem' }}>
                {report.items.length === 0 ? (
                  <div className="empty-state"><p>Aucun cycle pour cette période.</p></div>
                ) : (
                  <>
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
                              <td>
                                <div>{item.clientName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{item.clientCode}</div>
                              </td>
                              <td>{item.branchCode}</td>
                              <td>
                                <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : item.status === 'COMPLETED' ? 'badge-info' : item.status === 'SUSPENDED' ? 'badge-warning' : 'badge-error'}`}>
                                  {item.status}
                                </span>
                              </td>
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

                    {report.meta.totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" disabled={reportPage <= 1} onClick={() => setReportPage((p) => Math.max(1, p - 1))}>
                          Précédent
                        </button>
                        <span style={{ alignSelf: 'center', color: 'var(--color-muted)' }}>
                          Page {report.meta.page} / {report.meta.totalPages}
                        </span>
                        <button className="btn-secondary" disabled={reportPage >= report.meta.totalPages} onClick={() => setReportPage((p) => Math.min(report.meta.totalPages, p + 1))}>
                          Suivant
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!summary && !isLoading && (
        <div className="empty-state">
          <p>Aucune donnée financière disponible pour cette période.</p>
        </div>
      )}
    </div>
  )
}
