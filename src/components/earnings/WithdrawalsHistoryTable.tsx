import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UniversalDataTable } from './UniversalDataTable';
import { formatCurrency } from './earnings-utils';
import { WithdrawalHistory } from '@/types/earnings';

interface WithdrawalsHistoryTableProps {
  data: WithdrawalHistory[];
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

export const WithdrawalsHistoryTable: React.FC<WithdrawalsHistoryTableProps> = ({ data, loading = false, pagination, onRefresh }) => {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Withdrawals History</CardTitle>
      </CardHeader>
      <CardContent>
        <UniversalDataTable
          data={data}
          type="withdrawals-history"
          formatCurrency={formatCurrency}
          loading={loading}
          pagination={pagination}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
};
