'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchEarningsDashboard,
  fetchQuickStats,
  fetchBalanceSummary,
  fetchEscrowSummary,
  fetchEarningsHistory,
  fetchPurchasesHistory,
  fetchWithdrawalsHistory,
  fetchRecentActivities,
  fetchEscrows,
  withdrawEarnings
} from '@/store/slices/earningsSlice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { EARNINGS_HISTORY_LIMIT, RECENT_ACTIVITIES_LIMIT, PURCHASES_HISTORY_LIMIT, ESCROWS_LIMIT, WITHDRAWALS_HISTORY_LIMIT } from '@/constants/pagination';
import {
  DollarSign,
  History,
  Hourglass,
  Banknote
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import Container from '@/components/Container';
import {
  EarningsStatsCards,
  MonthlyChartsSection,
  RecentActivitiesTable,
  EarningsHistoryTable,
  PurchasesHistoryTable,
  WithdrawalsHistoryTable,
  EscrowSummaryCards,
  WithdrawSection,
  DashboardSkeleton,
  EarningsHistorySkeleton,
  PurchasesHistorySkeleton,
  EscrowListTableSkeleton,
  EscrowListTable,
} from '@/components/earnings';
import { EarningsEscrow } from '@/types/earnings';
import { DateRange } from 'react-day-picker';

const safeExtractEscrows = (escrows: EarningsEscrow[]): EarningsEscrow[] => {
  if (!escrows || !Array.isArray(escrows)) return [];
  
  return escrows.map(escrow => {
    // Ensure each escrow has the necessary properties
    return {
      ...escrow,
      _id: escrow._id,
      roomId: typeof escrow.roomId === 'string' 
        ? { _id: escrow.roomId, name: escrow.roomName || 'N/A' }
        : escrow.roomId || { _id: '', name: escrow.roomName || 'N/A' },
      roomName: escrow.roomName || (typeof escrow.roomId === 'object' ? escrow.roomId?.name : 'N/A'),
      amount: escrow.amount || escrow.amountPaid || 0,
      currency: escrow.currency || escrow.currencyUsed || 'USD',
      status: escrow.status || 'pending',
      type: escrow.type || 'creator',
      releaseDate: escrow.releaseDate
    };
  });
};

const EarningsPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const {
    dashboardData,
    quickStats,
    earningsHistory,
    earningsHistoryPagination,
    purchasesHistory,
    purchasesHistoryPagination,
    withdrawalsHistory,
    withdrawalsHistoryPagination,
    recentActivities,
    recentActivitiesPagination,
    escrows,
    dashboardLoading,
    earningsHistoryLoading,
    purchasesHistoryLoading,
    withdrawalsHistoryLoading,
    recentActivitiesLoading,
    escrowsLoading,
    escrowSummaryLoading,
    withdrawLoading,
    escrowSummary,
    escrowsPagination
  } = useSelector((state: RootState) => state.earnings);

  // Error handling useEffect
  // useEffect(() => {
  //   if (error) {
  //     toast.error(error);
  //     dispatch(clearError());
  //   }
  // }, [error, dispatch]);

  // Defensive data extraction with comprehensive null/undefined checks
  const safeMonthlyEarningsData = dashboardData?.monthlyEarnings && Array.isArray(dashboardData.monthlyEarnings) 
    ? dashboardData.monthlyEarnings
    : [];

  const safeMonthlyPurchasesData = dashboardData?.monthlyPurchases && Array.isArray(dashboardData.monthlyPurchases)
    ? dashboardData.monthlyPurchases
    : [];

  const safeRecentActivitiesData = recentActivities && Array.isArray(recentActivities)
    ? recentActivities 
    : dashboardData?.recentActivities && Array.isArray(dashboardData.recentActivities)
    ? dashboardData.recentActivities 
    : [];

  const safeEarningsHistory = Array.isArray(earningsHistory) ? earningsHistory : [];
  const safePurchasesHistory = Array.isArray(purchasesHistory) ? purchasesHistory : [];
  const safeWithdrawalsHistory = Array.isArray(withdrawalsHistory) ? withdrawalsHistory : [];
  const safeEscrows = useMemo(() => {
    const processedEscrows = safeExtractEscrows(escrows);
    return processedEscrows;
  }, [escrows]);

  // Defensive check for escrowSummary
  // const safeEscrowSummary = escrowSummary || {
  //   totalPendingEscrow: 0,
  //   totalReleasedEscrow: 0,
  //   totalRefundedEscrow: 0,
  //   totalDisputedEscrow: 0,
  //   currency: 'USD'
  // };

  // Fallback stats object to prevent undefined errors
  const stats = quickStats || {
    totalEarnings: 0,
    totalSpent: 0,
    availableBalance: 0,
    pendingEarnings: 0,
    totalSessionsCreated: 0,
    totalSessionsPurchased: 0,
    totalParticipants: 0,
    currency: 'USD'
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [debouncedStartDate, setDebouncedStartDate] = useState<string | undefined>(undefined);
  const [debouncedEndDate, setDebouncedEndDate] = useState<string | undefined>(undefined);
  const [isFirstHistoryTabLoad, setIsFirstHistoryTabLoad] = useState(true);

  const toYmd = (d?: Date) => {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toIsoStartOfDay = (d?: Date) => {
    if (!d) return undefined;
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    return start.toISOString();
  };

  const toIsoEndOfDay = (d?: Date) => {
    if (!d) return undefined;
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return end.toISOString();
  };
  useEffect(() => {
    setStartDate(toYmd(dateRange.from));
    setEndDate(toYmd(dateRange.to));
  }, [dateRange]);

  // Debounce date changes to avoid rapid re-fetches on fast clicks
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedStartDate(toIsoStartOfDay(dateRange.from));
      setDebouncedEndDate(toIsoEndOfDay(dateRange.to));
    }, 300);
    return () => clearTimeout(t);
  }, [dateRange]);

  // Main effect for fetching data based on tab and date range
  useEffect(() => {
    if (activeTab === 'dashboard') {
      dispatch(fetchEarningsDashboard({ startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchQuickStats());
      dispatch(fetchBalanceSummary());
      dispatch(fetchEscrowSummary({ startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchRecentActivities({ page: 1, limit: RECENT_ACTIVITIES_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchEarningsHistory({ page: 1, limit: EARNINGS_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchPurchasesHistory({ page: 1, limit: PURCHASES_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchWithdrawalsHistory({ page: 1, limit: WITHDRAWALS_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchEscrows({ page: 1, limit: ESCROWS_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
    } else if (activeTab === 'history') {
      setIsFirstHistoryTabLoad(true); // Reset first load state
      dispatch(fetchEarningsHistory({ page: 1, limit: EARNINGS_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchPurchasesHistory({ page: 1, limit: PURCHASES_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchWithdrawalsHistory({ page: 1, limit: WITHDRAWALS_HISTORY_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
    } else if (activeTab === 'escrow') {
      dispatch(fetchEscrowSummary({ startDate: debouncedStartDate, endDate: debouncedEndDate }));
      dispatch(fetchEscrows({ page: 1, limit: ESCROWS_LIMIT, startDate: debouncedStartDate, endDate: debouncedEndDate }));
    } else if (activeTab === 'withdraw') {
      dispatch(fetchBalanceSummary());
      dispatch(fetchQuickStats());
    }
  }, [dispatch, activeTab, debouncedStartDate, debouncedEndDate]);

  const handleWithdraw = async (amount: number, currency: string) => {
    try {
      await dispatch(withdrawEarnings({ amount, currency })).unwrap();
      dispatch(fetchBalanceSummary());
      dispatch(fetchEscrowSummary());
      dispatch(fetchQuickStats());
    } catch {
      toast.error("Failed to process withdrawal");
    }
  };

  const handleRefreshData = () => {
    dispatch(fetchBalanceSummary());
    dispatch(fetchEscrowSummary());
    dispatch(fetchQuickStats());
  };

  const handleRecentActivitiesRefresh = (params: { page?: number; limit?: number; search?: string }) => {
    dispatch(fetchRecentActivities({ 
      page: params.page || 1, 
      limit: params.limit || RECENT_ACTIVITIES_LIMIT, 
      startDate: debouncedStartDate, 
      endDate: debouncedEndDate,
      search: params.search 
    }));
  };

  const handleEarningsHistoryRefresh = (params: { page?: number; limit?: number; search?: string }) => {
    setIsFirstHistoryTabLoad(false); // Ensure first load state is reset on any refresh
    dispatch(fetchEarningsHistory({
      page: params.page || 1,
      limit: params.limit || EARNINGS_HISTORY_LIMIT,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
      search: params.search
    }));
  };

  const handlePurchasesHistoryRefresh = (params: { page?: number; limit?: number; search?: string }) => {
    setIsFirstHistoryTabLoad(false); // Ensure first load state is reset on any refresh
    dispatch(fetchPurchasesHistory({
      page: params.page || 1,
      limit: params.limit || PURCHASES_HISTORY_LIMIT,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
      search: params.search
    }));
  };

  const handleWithdrawalsHistoryRefresh = (params: { page?: number; limit?: number; search?: string }) => {
    setIsFirstHistoryTabLoad(false); // Ensure first load state is reset on any refresh
    dispatch(fetchWithdrawalsHistory({
      page: params.page || 1,
      limit: params.limit || WITHDRAWALS_HISTORY_LIMIT,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
      search: params.search
    }));
  };

  const handleEscrowsRefresh = (params: { page?: number; limit?: number; search?: string }) => {
    setIsFirstHistoryTabLoad(false); // Ensure first load state is reset on any refresh
    dispatch(fetchEscrows({
      page: params.page || 1,
      limit: params.limit || ESCROWS_LIMIT,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
      search: params.search
    }))
  };

  // Format currency function
  // const formatCurrency = (amount: number | undefined | null, currency: string = 'USD'): string => {
  //   if (amount === null || amount === undefined) return '$0.00';
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: currency,
  //   }).format(amount);
  // };

  return (  
    <Container>
      <div>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-2 sm:gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Earnings & Payouts</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage your earnings, view purchase history, and withdraw funds.
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Date range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 min-w-48 justify-start text-left font-normal" disabled={dashboardLoading}>
                      {dateRange.from && dateRange.to
                        ? `${toYmd(dateRange.from)} → ${toYmd(dateRange.to)}`
                        : 'Pick a date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange as DateRange}
                      onSelect={(range: DateRange | undefined) => {
                        if (dashboardLoading) return;
                        setDateRange(range || {});
                      }}
                      numberOfMonths={2}
                      defaultMonth={dateRange.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {startDate || endDate ? (
                <Button variant="ghost" className="h-9" onClick={() => setDateRange({})} disabled={dashboardLoading}>Clear</Button>
              ) : null}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <TabsList className="grid w-full grid-cols-4 h-auto mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <DollarSign className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <Hourglass className="w-4 h-4" />
              Escrow
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-1.5">
              <Banknote className="w-4 h-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {dashboardLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <EarningsStatsCards stats={{ ...stats, currency: stats.currency || 'USD' }} />

                <MonthlyChartsSection
                  monthlyEarningsData={safeMonthlyEarningsData}
                  monthlyPurchasesData={safeMonthlyPurchasesData}
                />

                <RecentActivitiesTable 
                  data={safeRecentActivitiesData} 
                  loading={recentActivitiesLoading}
                  pagination={recentActivitiesPagination}
                  onRefresh={handleRecentActivitiesRefresh}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {earningsHistoryLoading && isFirstHistoryTabLoad ? (
              <EarningsHistorySkeleton />
            ) : (
              <EarningsHistoryTable
                data={safeEarningsHistory}
                loading={earningsHistoryLoading}
                pagination={earningsHistoryPagination}
                onRefresh={handleEarningsHistoryRefresh}
              />
            )}

            {purchasesHistoryLoading && isFirstHistoryTabLoad ? (
              <PurchasesHistorySkeleton />
            ) : (
              <PurchasesHistoryTable
                data={safePurchasesHistory}
                loading={purchasesHistoryLoading}
                pagination={purchasesHistoryPagination}
                onRefresh={handlePurchasesHistoryRefresh}
              />
            )}

            {withdrawalsHistoryLoading && isFirstHistoryTabLoad ? (
              <PurchasesHistorySkeleton />
            ) : (
              <WithdrawalsHistoryTable
                data={safeWithdrawalsHistory}
                loading={withdrawalsHistoryLoading}
                pagination={withdrawalsHistoryPagination}
                onRefresh={handleWithdrawalsHistoryRefresh}
              />
            )}
          </TabsContent>

          <TabsContent value="escrow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="mb-1">Escrow Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Earnings are held in escrow for 14 days from the purchase date before being released.
                </p>
              </CardHeader>
              <CardContent>
                {escrowSummaryLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="h-32 bg-background/50 rounded-lg" />
                    ))}
                  </div>
                ) : !escrowSummary ? (
                  <p className="text-center text-muted-foreground py-10">No escrow summary available.</p>
                ) : (
                  <>
                    <EscrowSummaryCards escrowSummary={escrowSummary} />
                  </>
                )}
                
                <Separator className="my-6" />
                <CardTitle className="mb-5">Escrow List</CardTitle>
                {escrowsLoading && isFirstHistoryTabLoad ? (
                  <EscrowListTableSkeleton />
                ) : (
                  <EscrowListTable
                    escrows={safeEscrows}
                    loading={escrowsLoading}
                    pagination={escrowsPagination}
                    onRefresh={handleEscrowsRefresh}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <WithdrawSection
              availableBalance={stats.availableBalance}
              currency={stats.currency || 'USD'}
              withdrawLoading={withdrawLoading}
              onWithdraw={handleWithdraw}
              onRefreshData={handleRefreshData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default EarningsPage;