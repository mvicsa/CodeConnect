import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import AdminPlatformSettings from "@/components/settings/AdminPlatformSettings"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import PlatformWithdrawalsTable from "@/components/ui/data-table"
import StripeFeesAndBalance from "@/components/StripeFeesAndBalance"
import ManualPayoutForm from "@/components/ManualPayoutForm"
import DisputesTable from "@/components/DisputesTable"
import PlatformWithdrawForm from "@/components/PlatformWithdrawForm"

import data from "./data.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
              <div className="px-4 lg:px-6">
                <PlatformWithdrawalsTable />
              </div>
              <div className="px-4 lg:px-6">
                <StripeFeesAndBalance />
              </div>
              <div className="px-4 lg:px-6">
                <ManualPayoutForm />
              </div>
              <div className="px-4 lg:px-6">
                <PlatformWithdrawForm />
              </div>
              <div className="px-4 lg:px-6">
                <DisputesTable />
              </div>
              <div className="px-4 lg:px-6">
                <AdminPlatformSettings />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
