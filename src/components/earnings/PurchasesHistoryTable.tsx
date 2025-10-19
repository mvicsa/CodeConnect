import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UniversalDataTable } from './UniversalDataTable';
import { formatCurrency } from './earnings-utils';
import { EarningsEscrow, EarningsHistory, PurchasesHistory, RecentActivity, WithdrawalHistory } from '@/types/earnings';

interface PurchasesHistoryTableProps {
  data: PurchasesHistory[];
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

export const PurchasesHistoryTable: React.FC<PurchasesHistoryTableProps> = ({ data, loading = false, pagination, onRefresh }) => {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Purchases History</CardTitle>
      </CardHeader>
      <CardContent>
        <UniversalDataTable
          data={data as unknown as RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory[]}
          type="earnings-history"
          formatCurrency={formatCurrency}
          loading={loading}
          pagination={pagination}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
};
