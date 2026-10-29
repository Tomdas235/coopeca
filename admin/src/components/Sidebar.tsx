import { Link, useLocation, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  RefreshCcw,
  Building2,
  Activity,
  Shield,
  LogOut,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/cycles', label: 'Cycles', icon: CreditCard },
  { path: '/remittances', label: 'Remises', icon: RefreshCcw },
  { path: '/markets', label: 'Marchés', icon: Building2 },
  { path: '/health', label: 'Santé API', icon: Activity },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">C</div>
        <div className="brand-name">COOPECA<br /><span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Admin</span></div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? 'nav-item active'
                : 'nav-item'
            }
            end={item.path === '/'}
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a href="/login" className="nav-item logout-item">
          <Shield className="nav-icon" />
          <span className="nav-label">Déconnexion</span>
        </a>
      </div>
    </aside>
  )
}