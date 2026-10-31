import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { logout } from '../services/auth'

export default function MainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <Sidebar onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="layout-content">
        <Navbar
          onToggleMenu={() => setSidebarOpen((open) => !open)}
          onLogout={() => { logout(); navigate('/login') }}
        />
        <main className="layout-main">{children}</main>
      </div>
    </div>
  )
}