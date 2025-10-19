"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getPlatformEarnings, type PlatformEarningsSummary } from "@/services/adminPaymentsService"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const [summary, setSummary] = useState<PlatformEarningsSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getPlatformEarnings().then((data) => {
      if (mounted) setSummary(data)
    }).catch(() => {
      if (mounted) setError("Failed to load earnings")
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const currency = (v?: number) => (v == null ? "—" : `$${v.toFixed(2)}`)

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Earnings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "…" : currency(summary?.totalEarnings)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Platform
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {error ? error : "Platform earnings summary"} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Gross: {currency(summary?.totalGrossAmount)} · Stripe Fees: {currency(summary?.totalStripeFees)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Transactions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "…" : summary?.totalTransactions ?? "—"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Count
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Transactions processed <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Released: {currency(summary?.releasedEarnings)} · Pending: {currency(summary?.pendingEarnings)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Platform Net (after Stripe)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "…" : currency((summary?.totalGrossAmount || 0) - (summary?.totalEarnings || 0))}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Net
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Platform share estimate <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Withdrawn: {currency(summary?.withdrawnEarnings)}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Stripe Fees</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "…" : currency(summary?.totalStripeFees)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Fees
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Stripe fees over period <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Based on transactions</div>
        </CardFooter>
      </Card>
    </div>
  )
}
