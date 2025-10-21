"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { postPlatformWithdraw } from "@/services/adminPaymentsService"
import { toast } from "sonner"

export default function PlatformWithdrawForm() {
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState("Monthly withdrawal")
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    const amt = Number(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be greater than zero")
      toast.error("Amount must be greater than zero")
      return
    }
    setLoading(true)
    try {
      const res = await postPlatformWithdraw({ amount: amt, reason: reason || undefined })
      const msg = res?.message || "Platform withdrawal processed successfully"
      setMessage(msg)
      toast.success(msg)
      setAmount("")
    } catch (e) {
      const msg = (e as { response: { data: { message: string } } }).response.data.message || "Failed to process platform withdrawal"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Withdraw</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Monthly withdrawal" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={loading}>{loading ? "Processing…" : "Withdraw"}</Button>
          </div>
        </form>
        {message && <div className="text-green-600 mt-3 text-sm">{message}</div>}
        {error && <div className="text-destructive mt-3 text-sm">{error}</div>}
      </CardContent>
    </Card>
  )
}


