"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlatformBalance, getStripeFeesSummary, type PlatformBalance, type StripeFeesSummary } from "@/services/adminPaymentsService"

export default function StripeFeesAndBalance() {
  const [fees, setFees] = React.useState<StripeFeesSummary | null>(null)
  const [balance, setBalance] = React.useState<PlatformBalance | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([getStripeFeesSummary(), getPlatformBalance()])
      .then(([f, b]) => {
        if (!mounted) return
        setFees(f)
        setBalance(b)
      })
      .catch(() => mounted && setError("Failed to load fees/balance"))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const currency = (v?: number) => (v == null ? "—" : `$${v.toFixed(2)}`)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Fees Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Total Fees</div>
              <div className="text-right">{currency(fees?.totalStripeFees)}</div>
              <div className="text-muted-foreground">Total Gross</div>
              <div className="text-right">{currency(fees?.totalGrossAmount)}</div>
              <div className="text-muted-foreground">Transactions</div>
              <div className="text-right">{fees?.totalTransactions ?? "—"}</div>
              <div className="text-muted-foreground">Avg Fee</div>
              <div className="text-right">{currency(fees?.avgStripeFee)}</div>
              <div className="text-muted-foreground">Avg Fee %</div>
              <div className="text-right">{fees?.avgStripeFeePercentage?.toFixed?.(2)}%</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Total</div>
              <div className="text-right">{currency(balance?.totalBalance)}</div>
              <div className="text-muted-foreground">Available</div>
              <div className="text-right">{currency(balance?.availableBalance)}</div>
              <div className="text-muted-foreground">Pending</div>
              <div className="text-right">{currency(balance?.pendingBalance)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


