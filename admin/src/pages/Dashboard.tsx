import { useState, useEffect } from 'react'
import { getProfile, getBranches } from '../services/auth'
import { UserProfile } from '../types/api'

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Stats étendues (chargées en parallèle)
  const [stats, setStats] = useState({
    totalClients: 0,
    provisionalClients: 0,
    activeCycles: 0,
    totalCollected: '0',
    pendingWithdrawals: 0,
  })

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const [prof, brs] = await Promise.all([getProfile(), getBranches()])
        if (mounted) {
          setProfile(prof)
          setBranches(brs)
        }
        // Charger les stats depuis les endpoints dédiés
        const [clientsResp, cyclesResp, withdrawalsResp] = await Promise.all([
          api.get('/clients'),
          api.get('/tontine-cycles'),
          api.get('/withdrawals/pending'),
        ])
        if (!mounted) return

        const clients = clientsResp.data.items || clientsResp.data || []
        const cycles = cyclesResp.data.items || cyclesResp.data || []

        setStats({
          totalClients: clients.length,
          provisionalClients: clients.filter((c: any) => c.status === 'PROVISOIRE').length,
          activeCycles: cycles.filter((c: any) => c.status === 'ACTIVE').length,
          totalCollected: (
            cycles.reduce((sum: number, cy: any) => sum + (cy.totalCollectedXaf ? parseInt(cy.totalCollectedXaf, 10) : 0), 0) /
            1000
          ).toString(),
          pendingWithdrawals: withdrawalsResp.data.length,
        })
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }

  if (error) {
    return <div className="empty-state"><p>{error}</p></div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble des opérations COOPECA</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Utilisateur</h3>
          <div className="stat-value">{profile?.fullName}</div>
          <div className="stat-sub">{profile?.username}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rôle</div>
          <div className="stat-value">{profile?.role}</div>
          <div className="stat-sub">Accès système</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Agences</div>
          <div className="stat-value">{branches.length}</div>
          <div className="stat-sub">Autorisées</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Accès rapides</h2>
        <div className="quick-actions">
          <a href="/clients" className="action-card">
            <span className="action-icon">👥</span>
            <span className="action-label">Gestion des clients</span>
          </a>
          <a href="/cycles" className="action-card">
            <span className="action-icon">💳</span>
            <span className="action-label">Cycles de tontine</span>
          </a>
          <a href="/remittances" className="action-card">
            <span className="action-icon">💸</span>
            <span className="action-label">Remises de fonds</span>
          </a>
          <a href="/markets" className="action-card">
            <span className="action-icon">🏢</span>
            <span className="action-label">Marchés</span>
          </a>
        </div>
      </div>

      {branches.length > 0 && (
        <div className="dashboard-section">
          <h2>Agences autorisées</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.code}</td>
                  <td>{b.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}