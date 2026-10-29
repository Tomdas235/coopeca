import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { logout } from '../services/auth'

export default function MainLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-content">
        <Navbar onLogout={() => { logout(); navigate('/login') }} />
        <main className="layout-main">{children}</main>
      </div>
    </div>
  )
}