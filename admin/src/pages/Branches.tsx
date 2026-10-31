import { useEffect, useState } from 'react'
import { api, apiErrorToMessage } from '../services/api'
import type { BranchAccount, Market } from '../types/api'

export default function Branches() {
  const [branches, setBranches] = useState<BranchAccount[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [marketId, setMarketId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editPhone, setEditPhone] = useState('')

  async function loadBranches() {
    const response = await api.get<BranchAccount[]>('/branches')
    setBranches(response.data)
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [branchResponse, marketResponse] = await Promise.all([
          api.get<BranchAccount[]>('/branches'),
          api.get<Market[]>('/markets'),
        ])
        if (active) {
          setBranches(branchResponse.data)
          setMarkets(marketResponse.data)
          setMarketId(marketResponse.data[0]?.id ?? '')
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

  async function createBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.post<BranchAccount>('/branches', {
        code: code.trim(),
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        marketId,
      })
      setCode('')
      setName('')
      setAddress('')
      setPhone('')
      setNotice('L’agence a été créée.')
      await loadBranches()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  function beginEdit(branch: BranchAccount) {
    setEditingId(branch.id)
    setEditName(branch.name)
    setEditAddress(branch.address ?? '')
    setEditPhone(branch.phone ?? '')
  }

  async function saveEdit(branch: BranchAccount) {
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.patch<BranchAccount>(`/branches/${branch.id}`, {
        name: editName.trim(),
        address: editAddress.trim() || null,
        phone: editPhone.trim() || null,
      })
      setEditingId(null)
      setNotice('Les coordonnées de l’agence ont été mises à jour.')
      await loadBranches()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActive(branch: BranchAccount) {
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await api.patch<BranchAccount>(`/branches/${branch.id}`, { isActive: !branch.isActive })
      setNotice(branch.isActive ? 'L’agence a été désactivée.' : 'L’agence a été réactivée.')
      await loadBranches()
    } catch (cause) {
      setError(apiErrorToMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="loading-container"><div className="spinner" /><span>Chargement des agences…</span></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Agences</h1>
        <p>Coordonnées, rattachement au marché et état opérationnel</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="card branch-create-section">
        <h2>Créer une agence</h2>
        <form className="branch-create-form" onSubmit={createBranch}>
          <label className="form-group">
            <span className="form-label">Code agence</span>
            <input className="form-input" value={code} onChange={(event) => setCode(event.target.value)} required maxLength={30} />
          </label>
          <label className="form-group">
            <span className="form-label">Nom</span>
            <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} />
          </label>
          <label className="form-group">
            <span className="form-label">Marché</span>
            <select className="form-select" value={marketId} onChange={(event) => setMarketId(event.target.value)} required>
              {markets.map((market) => <option key={market.id} value={market.id}>{market.code} — {market.name}</option>)}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Téléphone</span>
            <input className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
          </label>
          <label className="form-group branch-address-field">
            <span className="form-label">Adresse</span>
            <input className="form-input" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={500} />
          </label>
          <button className="btn-primary" type="submit" disabled={isSaving || markets.length === 0}>
            {isSaving ? 'Enregistrement…' : 'Créer l’agence'}
          </button>
        </form>
        {markets.length === 0 && <p className="form-text">Créez ou activez un marché avant d’ajouter une agence.</p>}
      </section>

      <section className="branch-list-section">
        <div className="section-heading">
          <h2>Liste des agences</h2>
          <span className="badge badge-primary">{branches.length}</span>
        </div>
        <div className="table-container">
          <table className="table branch-table">
            <thead>
              <tr><th>Agence</th><th>Marché</th><th>Coordonnées</th><th>Clients</th><th>Comptes rattachés</th><th>État</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">Aucune agence.</td></tr>
              ) : branches.map((branch) => (
                <tr key={branch.id}>
                  <td><strong>{branch.code}</strong>{editingId === branch.id ? <input className="form-input branch-edit-name" aria-label={`Nom de ${branch.code}`} value={editName} onChange={(event) => setEditName(event.target.value)} /> : <span className="branch-name">{branch.name}</span>}</td>
                  <td>{branch.market.code} — {branch.market.name}</td>
                  <td>{editingId === branch.id ? <div className="branch-edit-contact"><input className="form-input" aria-label={`Adresse de ${branch.code}`} value={editAddress} onChange={(event) => setEditAddress(event.target.value)} placeholder="Adresse" /><input className="form-input" aria-label={`Téléphone de ${branch.code}`} value={editPhone} onChange={(event) => setEditPhone(event.target.value)} placeholder="Téléphone" /></div> : <>{branch.address || '—'}<span className="branch-name">{branch.phone || ''}</span></>}</td>
                  <td>{branch._count.clients}</td>
                  <td>{branch._count.userAccesses}</td>
                  <td><span className={`badge ${branch.isActive ? 'badge-success' : 'badge-error'}`}>{branch.isActive ? 'Active' : 'Désactivée'}</span></td>
                  <td className="branch-actions">
                    {editingId === branch.id ? (
                      <>
                        <button className="btn-secondary" type="button" disabled={isSaving} onClick={() => void saveEdit(branch)}>Enregistrer</button>
                        <button className="text-button" type="button" onClick={() => setEditingId(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="text-button" type="button" disabled={isSaving} onClick={() => beginEdit(branch)}>Modifier</button>
                        <button className="text-button" type="button" disabled={isSaving} onClick={() => void toggleActive(branch)}>{branch.isActive ? 'Désactiver' : 'Réactiver'}</button>
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