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
import {
  Button,
  Modal,
  Input,
  Select,
  FormField,
  FormSection,
  FormError,
} from '../components/ui'

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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [addressDetails, setAddressDetails] = useState('')
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
    setFirstName('')
    setLastName('')
    setPhone('')
    setNeighborhood('')
    setAddressDetails('')
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        neighborhood: neighborhood.trim() || null,
        addressDetails: addressDetails.trim() || null,
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
            {createError && <FormError message={createError} />}
            <FormSection title="Informations client">
              <FormField label="Prénom" required error={!firstName ? 'Ce champ est requis.' : null}>
                <Input
                  label="Prénom"
                  value={firstName}
                  onChange={(value) => setFirstName(value)}
                  required
                  maxLength={100}
                  accessibilityLabel="Prénom"
                />
              </FormField>
              <FormField label="Nom" required error={!lastName ? 'Ce champ est requis.' : null}>
                <Input
                  label="Nom"
                  value={lastName}
                  onChange={(value) => setLastName(value)}
                  required
                  maxLength={100}
                  accessibilityLabel="Nom"
                />
              </FormField>
              <FormField label="Téléphone">
                <Input
                  label="Téléphone"
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  maxLength={40}
                  accessibilityLabel="Téléphone"
                />
              </FormField>
              <FormField label="Quartier">
                <Input
                  label="Quartier"
                  value={neighborhood}
                  onChange={(value) => setNeighborhood(value)}
                  maxLength={160}
                  accessibilityLabel="Quartier"
                />
              </FormField>
              <FormField label="Adresse">
                <Input
                  label="Adresse"
                  value={addressDetails}
                  onChange={(value) => setAddressDetails(value)}
                  maxLength={500}
                  accessibilityLabel="Adresse"
                />
              </FormField>
            </FormSection>
            <FormSection title="Rattachement">
              <FormField label="Agence" required error={!branchId ? 'Ce champ est requis.' : null}>
                <Select
                  label="Agence"
                  value={branchId}
                  onChange={(value) => setBranchId(value)}
                  required
                  options={branches.map((b) => ({ label: `${b.code} — ${b.name}`, value: b.id }))}
                />
              </FormField>
              <FormField label="Marché">
                <Select
                  label="Marché"
                  value={marketId}
                  onChange={(value) => setMarketId(value)}
                  options={markets.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))}
                />
              </FormField>
              <FormField label="Agent collecteur" required error={!collectionAgentId ? 'Ce champ est requis.' : null}>
                <Select
                  label="Agent collecteur"
                  value={collectionAgentId}
                  onChange={(value) => setCollectionAgentId(value)}
                  required
                  options={agents.map((a) => ({ label: `${a.fullName} (${a.username})`, value: a.id }))}
                />
              </FormField>
            </FormSection>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isCreating}
                onClick={closeCreate}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
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
