import { useState, useEffect } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import {
  ClientListItem,
  ClientCreateInput,
  BranchAccount,
  Market,
  AgentAccount,
  PaginatedResponse,
} from '../types/api'
import { Button, Modal, Input } from '../components/ui'

export default function Clients() {
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [branches, setBranches] = useState<BranchAccount[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [agents, setAgents] = useState<AgentAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [clientCode, setClientCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [branchId, setBranchId] = useState('')
  const [marketId, setMarketId] = useState('')
  const [collectionAgentId, setCollectionAgentId] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadClients() {
      try {
        const response = await api.get<{ items: ClientListItem[]; meta: any }>('/clients')
        if (mounted) setClients(response.data.items)
      } catch (err: any) {
        if (mounted) setError(apiErrorToMessage(err))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadClients()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadReferences() {
      try {
        const [branchRes, marketRes, agentRes] = await Promise.all([
          api.get<BranchAccount[]>('/branches'),
          api.get<Market[]>('/markets/admin'),
          api.get<PaginatedResponse<AgentAccount>>('/users?role=AGENT&limit=50'),
        ])
        if (mounted) {
          setBranches(branchRes.data)
          setMarkets(marketRes.data)
          setAgents(agentRes.data.items)
        }
      } catch {
        /* references sont optionnels pour l'affichage de la liste */
      }
    }
    void loadReferences()
    return () => { mounted = false }
  }, [])

  function openCreate() {
    setCreateError('')
    setClientCode('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setBranchId('')
    setMarketId('')
    setCollectionAgentId('')
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreateError('')
  }

  async function createClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)
    try {
      const payload: ClientCreateInput = {
        clientCode: clientCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        branchId,
        marketId: marketId || undefined,
        collectionAgentId,
      }
      await api.post<ClientListItem>('/clients', payload)
      closeCreate()
      setNotice('Le client a été créé.')
      setClients([])
      await api.get<{ items: ClientListItem[]; meta: any }>('/clients').then((response) => {
        setClients(response.data.items)
      })
    } catch (cause: any) {
      setCreateError(apiErrorToMessage(cause))
    } finally {
      setIsCreating(false)
    }
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
            <h1>Clients</h1>
            <p>Gestion des clients de tontine</p>
          </div>
          <Button onClick={openCreate} variant="primary">
            Ajouter un client
          </Button>
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {createOpen && (
        <Modal isOpen={createOpen} onClose={closeCreate} title="Nouveau client">
          <form className="client-create-form" onSubmit={createClient}>
            {createError && <div className="alert alert-error" role="alert">{createError}</div>}
            <label className="form-group">
              <span className="form-label">Code client</span>
              <Input
                label="Code client"
                value={clientCode}
                onChange={(value) => setClientCode(value)}
                required
                maxLength={30}
                accessibilityLabel="Code client"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Prénom</span>
              <Input
                label="Prénom"
                value={firstName}
                onChange={(value) => setFirstName(value)}
                required
                maxLength={180}
                accessibilityLabel="Prénom"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Nom</span>
              <Input
                label="Nom"
                value={lastName}
                onChange={(value) => setLastName(value)}
                required
                maxLength={180}
                accessibilityLabel="Nom"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Téléphone</span>
              <Input
                label="Téléphone"
                value={phone}
                onChange={(value) => setPhone(value)}
                maxLength={40}
                accessibilityLabel="Téléphone"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Agence</span>
              <select
                className="form-input"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                required
              >
                <option value="">— Sélectionner —</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} — {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Marché</span>
              <select
                className="form-input"
                value={marketId}
                onChange={(event) => setMarketId(event.target.value)}
              >
                <option value="">— Aucun —</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.code} — {market.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Agent collecteur</span>
              <select
                className="form-input"
                value={collectionAgentId}
                onChange={(event) => setCollectionAgentId(event.target.value)}
                required
              >
                <option value="">— Sélectionner —</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName} ({agent.username})
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="btn-secondary"
                type="button"
                disabled={isCreating}
                onClick={closeCreate}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? 'Enregistrement…' : 'Créer le client'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Agence</th>
              <th>Marché</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan={6} className="empty-cell">Aucun client trouvé.</td></tr>
            ) : (
              clients.map((c) => {
                const createdAt = new Date(c.createdAt)
                return (
                  <tr key={c.id}>
                    <td>{c.clientCode}</td>
                    <td>{c.fullName}</td>
                    <td><span className="badge badge-info">{c.status}</span></td>
                    <td>{c.branchName ? `${c.branchCode} — ${c.branchName}` : '—'}</td>
                    <td>{c.marketName ? `${c.marketCode} — ${c.marketName}` : '—'}</td>
                    <td>{Number.isNaN(createdAt.getTime()) ? '—' : createdAt.toLocaleDateString('fr-FR')}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
