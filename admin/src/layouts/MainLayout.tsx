import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { logout } from '../services/auth'

export default function MainLayout() {
  const navigate = useNavigate()

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-content">
        <Navbar onLogout={() => { logout(); navigate('/login') }} />
        <main className="layout-main"><Outlet /></main>
      </div>
    </div>
  )
}