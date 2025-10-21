"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { postManualPayout } from "@/services/adminPaymentsService"
import { toast } from "sonner"

export default function ManualPayoutForm() {
  const [creatorId, setCreatorId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (!creatorId || !amount) {
      setError("Creator ID and amount are required")
      toast.error("Creator ID and amount are required")
      return
    }
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Invalid amount")
      toast.error("Invalid amount")
      return
    }
    setLoading(true)
    try {
      await postManualPayout(creatorId, { amount: amt, reason: reason || undefined })
      setMessage("Payout processed successfully")
      toast.success("Payout processed successfully")
      setCreatorId("")
      setAmount("")
      setReason("")
    } catch {
      setError("Failed to process payout")
      toast.error("Failed to process payout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Payout</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="creatorId">Creator ID</Label>
            <Input id="creatorId" value={creatorId} onChange={(e) => setCreatorId(e.target.value)} placeholder="creator id" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Emergency payout" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={loading}>{loading ? "Processing…" : "Process Payout"}</Button>
          </div>
        </form>
        {message && <div className="text-green-600 mt-3 text-sm">{message}</div>}
        {error && <div className="text-destructive mt-3 text-sm">{error}</div>}
      </CardContent>
    </Card>
  )
}


