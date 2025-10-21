import React from 'react';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const EarningsHistorySkeleton = () => {
  return <TableSkeleton columns={4} rows={5} />;
};

export default EarningsHistorySkeleton;
