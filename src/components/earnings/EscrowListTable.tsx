import React from 'react';
import { UniversalDataTable } from './UniversalDataTable';
import { formatCurrency } from './earnings-utils';
import { EarningsEscrow, PurchasesHistory, EarningsHistory, RecentActivity, WithdrawalHistory } from '@/types/earnings';

interface EscrowListTableProps {
  escrows: EarningsEscrow[];
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

export const EscrowListTable: React.FC<EscrowListTableProps> = ({ 
  escrows, 
  loading = false, 
  pagination, 
  onRefresh 
}) => {
  return (
    <UniversalDataTable 
      data={escrows as unknown as RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory[]}
      type="escrow"
      formatCurrency={formatCurrency}
      loading={loading}
      pagination={pagination}
      onRefresh={onRefresh}
    />
  );
};
