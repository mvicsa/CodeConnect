"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getDisputedTransactions, resolveDispute, type DisputedTransaction } from "@/services/adminPaymentsService"
import { toast } from "sonner"

export default function DisputesTable() {
  const [rows, setRows] = React.useState<DisputedTransaction[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [resolvingId, setResolvingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    getDisputedTransactions()
      .then((data) => mounted && setRows(data))
      .catch(() => mounted && setError("Failed to load disputes"))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  async function onResolve(id: string, decision: "approve" | "reject") {
    setResolvingId(id)
    try {
      await resolveDispute(id, { decision, reason: "Resolved via dashboard" })
      setRows((prev) => prev?.filter((r) => r._id !== id) ?? null)
      toast.success(`Dispute ${decision}d`)
    } catch {
      toast.error("Failed to resolve dispute")
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disputed Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading…</TableCell>
                </TableRow>
              )}
              {error && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">{error}</TableCell>
                </TableRow>
              )}
              {!loading && !error && rows?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No disputes</TableCell>
                </TableRow>
              )}
              {!loading && !error && rows?.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>${"" + (d.amount ?? "—")}</TableCell>
                  <TableCell>{d.reason ?? "—"}</TableCell>
                  <TableCell>{d.creatorId?.username ?? d.creatorId?.email ?? "—"}</TableCell>
                  <TableCell>{d.roomId?.name ?? "—"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" disabled={resolvingId === d._id} onClick={() => onResolve(d._id, "approve")}>Approve</Button>
                    <Button size="sm" variant="destructive" disabled={resolvingId === d._id} onClick={() => onResolve(d._id, "reject")}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


