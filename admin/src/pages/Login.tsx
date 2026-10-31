import { useState } from 'react'
import { login } from '../services/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login({ username, password })
      window.location.href = import.meta.env.BASE_URL
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">C</div>
          <h1>COOPECA Admin</h1>
          <p>Connexion au tableau de bord de gestion</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Identifiant</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <div className="login-footer">
          <p>COOPECA — Système de gestion de tontine</p>
        </div>
      </div>
    </div>
  )
}