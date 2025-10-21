import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UniversalDataTable } from './UniversalDataTable';
import { formatCurrency } from './earnings-utils';
import { EarningsEscrow, PurchasesHistory, EarningsHistory, RecentActivity, WithdrawalHistory } from '@/types/earnings';

interface RecentActivitiesTableProps {
  data: RecentActivity[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onRefresh?: (params: { page?: number; limit?: number; search?: string }) => void;
}

export const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({ data, loading = false, pagination, onRefresh }) => {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <UniversalDataTable
          data={data  as unknown as RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory[]}
          type="recent-activities"
          formatCurrency={formatCurrency}
          pagination={pagination}
          onRefresh={onRefresh}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
};
