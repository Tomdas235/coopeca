import { Link, NavLink } from 'react-router-dom'
import { clearToken } from '../services/auth'
import {
  LayoutDashboard,
  Users,
  UserRound,
  CreditCard,
  RefreshCcw,
  Building2,
  Building,
  Activity,
  Shield,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AdminPage, getLabel } from '../config/permissions'

const ALL_NAV_ITEMS: AdminPage[] = [
  '',
  'clients',
  'agents',
  'branches',
  'cycles',
  'remittances',
  'markets',
  'health',
  'withdrawals',
  'accountant',
  'cashier',
  'auditor',
]

const ICON_BY_PAGE: Record<AdminPage, React.ComponentType<any>> = {
  '': LayoutDashboard,
  clients: Users,
  agents: UserRound,
  branches: Building,
  cycles: CreditCard,
  remittances: RefreshCcw,
  markets: Building2,
  health: Activity,
  withdrawals: CreditCard,
  accountant: LayoutDashboard,
  cashier: LayoutDashboard,
  auditor: LayoutDashboard,
}

export default function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { user, isLoading, hasPermission } = useAuth()

  if (isLoading || !user) {
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">C</div>
          <div className="brand-name">COOPECA<br /><span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Admin</span></div>
        </div>
        <nav className="sidebar-nav" />
        <div className="sidebar-footer">
          <Link
            to="/login"
            onClick={() => { clearToken(); onNavigate() }}
            className="nav-item logout-item"
          >
            <Shield className="nav-icon" />
            <span className="nav-label">Déconnexion</span>
          </Link>
        </div>
      </aside>
    )
  }

  const visibleItems = ALL_NAV_ITEMS.filter((page) => hasPermission(page))

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">C</div>
        <div className="brand-name">COOPECA<br /><span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Admin</span></div>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map((page) => {
          const Icon = ICON_BY_PAGE[page]
          return (
            <NavLink
              key={page}
              to={`/${page || ''}`}
              className={({ isActive }) =>
                isActive
                  ? 'nav-item active'
                  : 'nav-item'
              }
              end={page === ''}
              onClick={onNavigate}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{getLabel(page)}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-role">{user.role}</span>
          <span className="sidebar-user-name">{user.username}</span>
        </div>
        <Link
          to="/login"
          onClick={() => { clearToken(); onNavigate() }}
          className="nav-item logout-item"
        >
          <Shield className="nav-icon" />
          <span className="nav-label">Déconnexion</span>
        </Link>
      </div>
    </aside>
  )
}
