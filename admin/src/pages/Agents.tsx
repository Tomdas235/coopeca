import { useEffect, useState } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import { getBranches } from '../services/auth'
import type { AgentAccount, PaginatedResponse } from '../types/api'
import {
  Button,
  Modal,
  Input,
  Select,
  FormField,
  FormSection,
} from '../components/ui'

type Branch = { id: string; code: string; name: string }

export default function Agents() {
  const [agents, setAgents] = useState<AgentAccount[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [branchId, setBranchId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const [createOpen, setCreateOpen] = useState(false)

  async function loadAgents() {
    const response = await api.get<PaginatedResponse<AgentAccount>>('/users?role=AGENT&limit=50')
    setAgents(response.data.items)
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [agentResponse, branchResponse] = await Promise.all([
          api.get<PaginatedResponse<AgentAccount>>('/users?role=AGENT&limit=50'),
          getBranches(),
        ])
        if (active) {
          setAgents(agentResponse.data.items)
          setBranches(branchResponse)
          setBranchId(branchResponse[0]?.id ?? '')
        }
      } catch (cause) {
        if (active) setError(apiErrorToMessage(cause))
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function createAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.post<AgentAccount>('/users/agents', {
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        password,
        branchId,
      })
      setUsername('')
      setFullName('')
      setPhone('')
      setPassword('')
      setNotice('Le compte agent a été créé.')
      setCreateOpen(false)
      await loadAgents()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  function openCreate() {
    setError('')
    setUsername('')
    setFullName('')
    setPhone('')
    setPassword('')
    setBranchId(branches.length > 0 ? branches[0].id : '')
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
  }

  function beginEdit(agent: AgentAccount) {
    setEditingId(agent.id)
    setEditFullName(agent.fullName)
    setEditPhone(agent.phone ?? '')
  }

  async function saveEdit(agent: AgentAccount) {
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.patch<AgentAccount>(`/users/${agent.id}`, {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || null,
      })
      setEditingId(null)
      setNotice('Les informations de l’agent ont été mises à jour.')
      await loadAgents()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  async function changeAgentStatus(agent: AgentAccount) {
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.patch<AgentAccount>(`/users/${agent.id}`, { isActive: !agent.isActive })
      setNotice(agent.isActive ? 'Le compte agent a été désactivé.' : 'Le compte agent a été réactivé.')
      await loadAgents()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="loading-container"><div className="spinner" /><span>Chargement des agents…</span></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div>
            <h1>Agents</h1>
            <p>Comptes, coordonnées et accès aux agences</p>
          </div>
          <Button onClick={openCreate} variant="primary">
            Créer un agent
          </Button>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      {createOpen && (
        <Modal isOpen={createOpen} onClose={closeCreate} title="Nouveau compte agent">
          <form className="agent-create-form" onSubmit={createAgent}>
            <FormSection title="Informations du compte">
              <FormField label="Identifiant" required error={!username ? 'Ce champ est requis.' : null}>
                <Input
                  label="Identifiant"
                  value={username}
                  onChange={(value) => setUsername(value)}
                  required
                  maxLength={80}
                  accessibilityLabel="Identifiant"
                />
              </FormField>
              <FormField label="Nom complet" required error={!fullName ? 'Ce champ est requis.' : null}>
                <Input
                  label="Nom complet"
                  value={fullName}
                  onChange={(value) => setFullName(value)}
                  required
                  maxLength={180}
                  accessibilityLabel="Nom complet"
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
              <FormField label="Mot de passe initial" required error={!password ? 'Ce champ est requis.' : null}>
                <Input
                  label="Mot de passe initial"
                  type="password"
                  value={password}
                  onChange={(value) => setPassword(value)}
                  required
                  maxLength={256}
                  accessibilityLabel="Mot de passe initial"
                />
              </FormField>
              <FormField label="Agence principale" required error={!branchId ? 'Ce champ est requis.' : null}>
                <Select
                  label="Agence principale"
                  value={branchId}
                  onChange={(value) => setBranchId(value)}
                  required
                  options={branches.map((b) => ({ label: `${b.code} — ${b.name}`, value: b.id }))}
                />
              </FormField>
              {branches.length === 0 && <p className="form-text">Aucune agence autorisée n’est disponible pour l’affectation.</p>}
            </FormSection>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="btn-secondary"
                type="button"
                disabled={isSaving || branches.length === 0}
                onClick={closeCreate}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                type="submit"
                disabled={isSaving || branches.length === 0}
              >
                {isSaving ? 'Enregistrement…' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <section className="agent-list-section">
        <div className="section-heading">
          <h2>Comptes agents</h2>
          <span className="badge badge-primary">{agents.length}</span>
        </div>
        <div className="table-container">
          <table className="table agent-table">
            <thead>
              <tr><th>Agent</th><th>Téléphone</th><th>Agence</th><th>État</th><th>Créé le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">Aucun compte agent.</td></tr>
              ) : agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    {editingId === agent.id ? (
                      <input className="form-input" aria-label={`Nom de ${agent.username}`} value={editFullName} onChange={(event) => setEditFullName(event.target.value)} />
                    ) : <><strong>{agent.fullName}</strong><span className="agent-username">{agent.username}</span></>}
                  </td>
                  <td>{editingId === agent.id ? <input className="form-input" aria-label={`Téléphone de ${agent.username}`} value={editPhone} onChange={(event) => setEditPhone(event.target.value)} /> : agent.phone || '—'}</td>
                  <td>{agent.branchAccesses.map((access) => `${access.branchCode} — ${access.branchName}`).join(', ') || '—'}</td>
                  <td><span className={`badge ${agent.isActive ? 'badge-success' : 'badge-error'}`}>{agent.isActive ? 'Actif' : 'Désactivé'}</span></td>
                  <td>{new Date(agent.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="agent-actions">
                    {editingId === agent.id ? (
                      <>
                        <button className="btn-secondary" type="button" disabled={isSaving} onClick={() => void saveEdit(agent)}>Enregistrer</button>
                        <button className="text-button" type="button" onClick={() => setEditingId(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="text-button" type="button" disabled={isSaving} onClick={() => beginEdit(agent)}>Modifier</button>
                        <button className="text-button" type="button" disabled={isSaving} onClick={() => void changeAgentStatus(agent)}>{agent.isActive ? 'Désactiver' : 'Réactiver'}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
