import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Building2, CreditCard, History, Store, UserRound, Users } from 'lucide-react'
import { apiErrorToMessage } from '../services/api'
import { getProfile, getBranches } from '../services/auth'
import { UserProfile } from '../types/api'

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const [prof, brs] = await Promise.all([getProfile(), getBranches()])
        if (mounted) {
          setProfile(prof)
          setBranches(brs)
        }
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

  const administrationLinks = [
    { to: '/clients', label: 'Clients', Icon: Users },
    { to: '/agents', label: 'Agents', Icon: UserRound },
    { to: '/branches', label: 'Agences', Icon: Building2 },
    { to: '/markets', label: 'Marchés', Icon: Store },
  ]
  const operationsLinks = [
    ...(profile?.role === 'SUPERVISOR'
      ? [{ to: '/withdrawals', label: 'Retraits à valider', Icon: BadgeCheck }]
      : []),
    { to: '/cycles', label: 'Cycles de tontine', Icon: CreditCard },
    { to: '/remittances', label: 'Remises historiques', Icon: History },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble des opérations COOPECA</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Utilisateur</div>
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

      {profile?.role === 'ADMIN' && (
        <div className="dashboard-section">
          <h2>Administration</h2>
          <div className="quick-actions">
            {administrationLinks.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className="action-card">
                <Icon className="action-icon" aria-hidden="true" />
                <span className="action-label">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h2>Opérations</h2>
        <div className="quick-actions">
          {operationsLinks.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className="action-card">
              <Icon className="action-icon" aria-hidden="true" />
              <span className="action-label">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {branches.length > 0 && (
        <div className="dashboard-section">
          <h2>Agences autorisées</h2>
          <div className="table-container">
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
        </div>
      )}
    </div>
  )
}