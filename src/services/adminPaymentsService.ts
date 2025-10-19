import api from "@/lib/axios"

export type PlatformEarningsSummary = {
  totalEarnings: number
  totalGrossAmount: number
  totalStripeFees: number
  totalTransactions: number
  releasedEarnings: number
  pendingEarnings: number
  withdrawnEarnings: number
}

export type TransactionAnalyticsItem = {
  _id: string
  totalEarnings: number
  totalGrossAmount: number
  totalStripeFees: number
  transactionCount: number
  avgTransactionValue: number
}

export type PlatformWithdrawal = {
  _id: string
  amount: number
  status: string
  withdrawnAt?: string
  roomId?: { name: string }
  purchaseId?: { amountPaid: number; currencyUsed: string; purchaseDate?: string }
}

export type CreatorEarningsResponse = {
  summary: PlatformEarningsSummary
  transactions: Array<{
    _id: string
    amount: number
    status: string
    roomId?: { name: string }
    purchaseId?: { amountPaid: number; currencyUsed: string }
  }>
}

export type StripeFeesSummary = {
  totalStripeFees: number
  totalGrossAmount: number
  totalTransactions: number
  avgStripeFee: number
  avgStripeFeePercentage: number
}

export type PlatformBalance = {
  totalBalance: number
  availableBalance: number
  pendingBalance: number
}

export type DisputedTransaction = {
  _id: string
  status: string
  amount: number
  reason?: string
  creatorId?: { username?: string; email?: string }
  roomId?: { name?: string }
}

const base = "/admin/payments"

export async function getPlatformEarnings(params?: { startDate?: string; endDate?: string }) {
  const { data } = await api.get<PlatformEarningsSummary>(`${base}/platform-earnings`, { params })
  return data
}

export async function getTransactionAnalytics(params?: { period?: "daily" | "weekly" | "monthly"; startDate?: string; endDate?: string }) {
  const { data } = await api.get<TransactionAnalyticsItem[]>(`${base}/transaction-analytics`, { params })
  return data
}

export async function getPlatformWithdrawals(params?: { startDate?: string; endDate?: string; status?: string }) {
  const { data } = await api.get<PlatformWithdrawal[]>(`${base}/platform-withdrawals`, { params })
  return data
}

export async function getCreatorEarnings(creatorId: string, params?: { startDate?: string; endDate?: string }) {
  const { data } = await api.get<CreatorEarningsResponse>(`${base}/creator-earnings/${creatorId}`, { params })
  return data
}

export async function getStripeFeesSummary(params?: { startDate?: string; endDate?: string }) {
  const { data } = await api.get<StripeFeesSummary>(`${base}/stripe-fees-summary`, { params })
  return data
}

export async function getPlatformBalance() {
  const { data } = await api.get<PlatformBalance>(`${base}/platform-balance`)
  return data
}

export async function postManualPayout(creatorId: string, body: { amount: number; reason?: string }) {
  const { data } = await api.post(`${base}/manual-payout/${creatorId}`, body)
  return data
}

export async function getDisputedTransactions() {
  const { data } = await api.get<DisputedTransaction[]>(`${base}/disputed-transactions`)
  return data
}

export async function resolveDispute(transactionId: string, body: { decision: string; reason?: string }) {
  const { data } = await api.post(`${base}/resolve-dispute/${transactionId}`, body)
  return data
}

export async function postPlatformWithdraw(body: { amount: number; reason?: string }) {
  const { data } = await api.post(`${base}/platform-withdraw`, body)
  return data
}


