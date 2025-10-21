'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import api from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

type PlatformSettings = {
  platformFeePercentage: number
  escrowPeriod: number
  adminBypassEscrow: boolean
}

const initialSettings: PlatformSettings = {
  platformFeePercentage: 20,
  escrowPeriod: 14,
  adminBypassEscrow: false,
}

export default function AdminPlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/platform-settings')
      setSettings({
        platformFeePercentage: Number(data.platformFeePercentage ?? 20),
        escrowPeriod: Number(data.escrowPeriod ?? 14),
        adminBypassEscrow: Boolean(data.adminBypassEscrow ?? false),
      })
    } catch {
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveFee = useCallback(async () => {
    try {
      setSaving(true)
      await api.put('/admin/platform-settings/fee-percentage', {
        percentage: Number(settings.platformFeePercentage),
      })
    } catch {
      toast.error("'Failed to update fee percentage");
    } finally {
      setSaving(false)
    }
  }, [settings.platformFeePercentage])

  const saveEscrow = useCallback(async () => {
    try {
      setSaving(true)
      await api.put('/admin/platform-settings/escrow-period', {
        days: Number(settings.escrowPeriod),
      })
    } catch {
      toast.error("Failed to update escrow period");
    } finally {
      setSaving(false)
    }
  }, [settings.escrowPeriod])

  const saveBypass = useCallback(async () => {
    try {
      setSaving(true)
      await api.put('/admin/platform-settings/admin-bypass-escrow', {
        enabled: Boolean(settings.adminBypassEscrow),
      })
    } catch {
      toast.error("Failed to update admin bypass");
    } finally {
      setSaving(false)
    }
  }, [settings.adminBypassEscrow])

  const isDisabled = useMemo(() => loading || saving, [loading, saving])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Platform Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 max-w-sm">
          <Label htmlFor="fee">Platform Fee Percentage</Label>
          <Input
            id="fee"
            type="number"
            min={0}
            max={100}
            value={settings.platformFeePercentage}
            onChange={(e) =>
              setSettings((s) => ({ ...s, platformFeePercentage: Number(e.target.value) }))
            }
            disabled={isDisabled}
          />
          <Button onClick={saveFee} disabled={isDisabled}>
            Save Fee Percentage
          </Button>
        </div>

        <div className="grid gap-2 max-w-sm">
          <Label htmlFor="escrow">Escrow Period (days)</Label>
          <Input
            id="escrow"
            type="number"
            min={0}
            value={settings.escrowPeriod}
            onChange={(e) => setSettings((s) => ({ ...s, escrowPeriod: Number(e.target.value) }))}
            disabled={isDisabled}
          />
          <Button onClick={saveEscrow} disabled={isDisabled}>
            Save Escrow Period
          </Button>
        </div>

        <div className="flex items-center justify-between max-w-sm">
          <div className="grid gap-1">
            <Label htmlFor="bypass">Admin Bypass Escrow</Label>
            <span className="text-sm text-muted-foreground">Allow admins to bypass escrow holds.</span>
          </div>
          <Switch
            id="bypass"
            checked={settings.adminBypassEscrow}
            onCheckedChange={(checked) => setSettings((s) => ({ ...s, adminBypassEscrow: checked }))}
            disabled={isDisabled}
          />
        </div>
        <Button onClick={saveBypass} disabled={isDisabled}>
          Save Bypass Setting
        </Button>
      </CardContent>
    </Card>
  )
}



