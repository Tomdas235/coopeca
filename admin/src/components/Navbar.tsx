import { useState } from 'react'
import { Menu, User, Bell } from 'lucide-react'

interface NavbarProps {
  onToggleMenu: () => void
  onLogout: () => void
}

export default function Navbar({ onToggleMenu, onLogout }: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-content">
          <button className="menu-toggle" type="button" aria-label="Ouvrir le menu" onClick={onToggleMenu}>
          <Menu size={20} />
        </button>
        <div className="navbar-title">COOPECA Admin</div>
        <div className="navbar-actions">
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button
            className="icon-btn profile-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="Profil utilisateur"
          >
            <User size={20} />
          </button>
          {userMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-item" onClick={onLogout}>
                Déconnexion
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}