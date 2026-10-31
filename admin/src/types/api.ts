export type PaginatedResponse<T> = {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiError = {
  code?: string
  message?: string
  statusCode?: number
}

export interface ClientListItem {
  id: string
  clientCode: string
  fullName: string
  status: string
  branchId: string | null
  marketId: string | null
  branchCode?: string
  branchName?: string
  marketCode?: string | null
  marketName?: string | null
  createdAt: string
}

export interface ClientDetail {
  id: string
  clientCode: string
  firstName: string
  lastName: string
  status: string
  branchId: string | null
  marketId: string | null
  collectionAgentId: string | null
  createdAt: string
}

export interface ClientCreateInput {
  clientCode: string
  firstName: string
  lastName: string
  phone?: string | null
  neighborhood?: string | null
  addressDetails?: string | null
  branchId: string
  marketId?: string
  collectionAgentId: string
}

export interface ClientUpdateInput {
  firstName?: string
  lastName?: string
  phone?: string | null
  neighborhood?: string | null
  addressDetails?: string | null
  status?: string
  branchId?: string
  marketId?: string | null
  collectionAgentId?: string | null
  rejectionReason?: string | null
}

export interface Market {
  id: string
  code: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface MarketCreateInput {
  code: string
  name: string
}

export interface MarketActiveInput {
  isActive: boolean
}

export interface TontineCycle {
  id: string
  status: string
  fixedAmountXaf: string
  installmentCount: number
  totalCollectedXaf: string
  targetInstallments: number
  availableBalanceXaf: string
  commissionPaid: boolean
}

export interface CycleDepositInput {
  amountXaf: string
  idempotencyKey: string
  declaredAt?: string
}

export interface CycleWithdrawalInput {
  amountXaf: string
  closesCycle: boolean
  idempotencyKey: string
  reason?: string
}

export interface WithdrawalReviewInput {
  decision: 'APPROVE' | 'REJECT'
  reason?: string
}

export interface WithdrawalRequest {
  id: string
  cycleId: string
  requestedByAgentId: string
  requestedByAgentName?: string
  amountXaf: string
  closesCycle: boolean
  status: string
  reason?: string
  rejectionReason?: string | null
  requestedAt: string
  reviewedAt: string | null
}

export interface Remittance {
  id: string
  agentId: string
  branchId: string
  marketId: string
  remittanceNo: string
  status: string
  declaredTotalXaf: string
  clientOperationId: string
  cashierNote: string | null
  createdAt: string
}

export interface RemittanceCreateInput {
  agentId: string
  branchId: string
  marketId: string
  periodStart: string
  periodEnd: string
  declaredAmountXaf: string
  description?: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface LoginInput {
  username: string
  password: string
}

export interface UserProfile {
  id: string
  username: string
  fullName: string
  role: string
  branches: Array<{
    id: string
    code: string
    name: string
  }>
}


export interface FinancialSummaryBranch {
  id: string
  code: string
  name: string
}

export interface FinancialSummary {
  period: {
    from: string | null
    to: string | null
  }
  branches: FinancialSummaryBranch[]
  summary: {
    totalCycles: number
    activeCycles: number
    completedCycles: number
    closedCycles: number
    suspendedCycles: number
    totalCollectedXaf: string
    totalWithdrawnXaf: string
    totalCommissionXaf: string
    totalAvailableBalanceXaf: string
    pendingWithdrawals: number
    approvedWithdrawals: number
    rejectedWithdrawals: number
  }
}

export interface ReconciliationReportItem {
  cycleId: string
  clientId: string
  clientCode: string
  clientName: string
  branchId: string
  branchCode: string
  branchName: string
  marketId: string
  marketCode: string
  marketName: string
  status: string
  fixedAmountXaf: string
  targetInstallments: number
  installmentCount: number
  totalCollectedXaf: string
  totalDepositedXaf: string
  totalWithdrawnXaf: string
  totalCommissionXaf: string
  availableBalanceXaf: string
  commissionPaid: boolean
  openedAt: string
  completedAt: string | null
  closedAt: string | null
  pendingWithdrawals: number
  approvedWithdrawals: number
  rejectedWithdrawals: number
}

export interface ReconciliationReport {
  items: ReconciliationReportItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AgentAccount {
  id: string
  username: string
  fullName: string
  phone: string | null
  role: 'AGENT'
  isActive: boolean
  createdAt: string
  branchAccesses: Array<{
    branchId: string
    branchCode: string
    branchName: string
    isPrimary: boolean
    marketIds: string[]
  }>
}

export interface BranchAccount {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  isActive: boolean
  marketId: string
  createdAt: string
  updatedAt: string
  market: Pick<Market, 'id' | 'code' | 'name' | 'isActive'>
  _count: { clients: number; userAccesses: number }
}