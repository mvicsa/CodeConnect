import React from 'react';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const PurchasesHistorySkeleton = () => {
  return <TableSkeleton columns={4} rows={5} />;
};

export default PurchasesHistorySkeleton;
