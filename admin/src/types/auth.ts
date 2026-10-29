import { UserProfile } from './api'

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT' | 'AGENT' | 'CASHIER' | 'AUDITOR'

export interface AuthContextType {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
  hasBranchAccess: (branchId: string) => boolean
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 6,
  SUPERVISOR: 5,
  ACCOUNTANT: 4,
  AUDITOR: 3,
  CASHIER: 2,
  AGENT: 1,
}

export function roleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0
}

export function canAccessRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  return requiredRoles.some((r) => roleLevel(userRole) >= roleLevel(r))
}