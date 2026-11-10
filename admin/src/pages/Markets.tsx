import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getProfile } from '../services/auth'
import { Market } from '../types/api'
import { Button, Modal, Input } from '../components/ui'

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [canManageMarkets, setCanManageMarkets] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const [createOpen, setCreateOpen] = useState(false)

  async function loadMarkets() {
    const response = await api.get<Market[]>('/markets/admin')
    setMarkets(response.data)
  }

  useEffect(() => {
    let mounted = true
    async function loadMarkets() {
      try {
        const profile = await getProfile()
        const canManage = profile.role === 'ADMIN' || profile.role === 'SUPERVISOR'
        const response = await api.get<Market[]>(canManage ? '/markets/admin' : '/markets')
        if (mounted) {
          setCanManageMarkets(canManage)
          setMarkets(response.data)
        }
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadMarkets()
    return () => { mounted = false }
  }, [])

  async function createMarket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.post<Market>('/markets', { code: code.trim(), name: name.trim() })
      setCode('')
      setName('')
      setNotice('Le marché a été créé.')
      setCreateOpen(false)
      await loadMarkets()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  function openCreate() {
    setCode('')
    setName('')
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
  }

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Chargement…</span></div>
  }
  if (error) return <div className="empty-state"><p>{error}</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div>
            <h1>Marchés</h1>
            <p>Gestion des marchés autonomes</p>
          </div>
          {canManageMarkets && (
            <Button onClick={openCreate} variant="primary">
              Ajouter un marché
            </Button>
          )}
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {canManageMarkets && createOpen && (
        <Modal isOpen={createOpen} onClose={closeCreate} title="Nouveau marché">
          <form className="market-create-form" onSubmit={createMarket}>
            <label className="form-group">
              <span className="form-label">Code marché</span>
              <Input
                label="Code marché"
                value={code}
                onChange={(value) => setCode(value)}
                required
                maxLength={40}
                accessibilityLabel="Code marché"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Nom</span>
              <Input
                label="Nom"
                value={name}
                onChange={(value) => setName(value)}
                required
                maxLength={160}
                accessibilityLabel="Nom"
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="btn-secondary"
                type="button"
                disabled={isSaving}
                onClick={closeCreate}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement…' : 'Créer le marché'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {markets.length === 0 ? (
              <tr><td colSpan={4} className="empty-cell">Aucun marché trouvé.</td></tr>
            ) : (
              markets.map((m) => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td>{m.name}</td>
                  <td><span className={`badge ${m.isActive ? 'badge-success' : 'badge-error'}`}>{m.isActive ? 'Actif' : 'Inactif'}</span></td>
                  <td>{m.createdAt && !Number.isNaN(new Date(m.createdAt).getTime()) ? new Date(m.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
