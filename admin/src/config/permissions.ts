// ============================================================================
// COOPECA Admin — Mapping des permissions par rôle
// Source : règles métier COOPECA (docs/DECISIONS_METIER.md) + périmètre par rôle.
//
// ⚠️  Ce mapping est une proposition basée sur la logique métier naturelle.
// Il n'existe pas de définition explicite de permissions par rôle dans le
// backend actuel (UserProfile ne contient que le rôle et les branches).
// À valider avec l'équipe métier avant mise en production.
//
// Clés de pages = chemin de route (sans le basename /admin).
// ============================================================================

export type AdminPage =
  | ''
  | 'clients'
  | 'agents'
  | 'branches'
  | 'cycles'
  | 'remittances'
  | 'markets'
  | 'health'
  | 'withdrawals'
  | 'accountant'
  | 'cashier'
  | 'auditor'

export type AdminRole = 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT' | 'CASHIER' | 'AUDITOR' | 'AGENT'

export const PAGE_PERMISSIONS: Record<AdminRole, AdminPage[]> = {
  ADMIN: [
    '', 'clients', 'agents', 'branches', 'cycles', 'remittances',
    'markets', 'health', 'withdrawals', 'accountant', 'cashier', 'auditor',
  ],
  SUPERVISOR: [
    '', 'clients', 'agents', 'branches', 'cycles', 'remittances',
    'markets', 'health', 'withdrawals',
  ],
  ACCOUNTANT: ['', 'cycles', 'remittances', 'markets', 'accountant', 'health'],
  CASHIER: ['', 'clients', 'cycles', 'remittances', 'cashier', 'health'],
  AUDITOR: ['', 'clients', 'cycles', 'remittances', 'markets', 'auditor', 'health'],
  AGENT: ['', 'clients', 'cycles', 'health'],
}

export function roleHasPermission(role: AdminRole | string, page: AdminPage): boolean {
  const pages = PAGE_PERMISSIONS[role as AdminRole]
  if (!pages) return false
  return pages.includes(page)
}

export function getLabel(page: AdminPage): string {
  const labels: Record<AdminPage, string> = {
    '': 'Tableau de bord',
    clients: 'Clients',
    agents: 'Agents',
    branches: 'Agences',
    cycles: 'Cycles',
    remittances: 'Remises',
    markets: 'Marchés',
    health: 'Santé API',
    withdrawals: 'Retraits',
    accountant: 'Espace comptable',
    cashier: 'Espace caissier',
    auditor: 'Espace auditeur',
  }
  return labels[page] ?? page
}

export function getIcon(page: AdminPage) {
  switch (page) {
    case '': return 'dashboard'
    case 'clients': return 'clients'
    case 'agents': return 'agents'
    case 'branches': return 'branches'
    case 'cycles': return 'cycles'
    case 'remittances': return 'remittances'
    case 'markets': return 'markets'
    case 'health': return 'health'
    case 'withdrawals': return 'withdrawals'
    case 'accountant': return 'accountant'
    case 'cashier': return 'cashier'
    case 'auditor': return 'auditor'
    default: return 'dashboard'
  }
}
