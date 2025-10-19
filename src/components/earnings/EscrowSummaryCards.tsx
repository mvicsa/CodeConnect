import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Hourglass,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
} from 'lucide-react';
import { formatCurrency } from './earnings-utils';

interface EscrowSummaryCardsProps {
  escrowSummary: {
    totalPendingEscrow: number;
    totalReleasedEscrow: number;
    totalRefundedEscrow: number;
    totalDisputedEscrow: number;
    currency: string;
  };
}

export const EscrowSummaryCards: React.FC<EscrowSummaryCardsProps> = ({ escrowSummary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pending Escrow</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(escrowSummary.totalPendingEscrow, escrowSummary.currency)}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Released Escrow</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(escrowSummary.totalReleasedEscrow, escrowSummary.currency)}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Refunded Escrow</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(escrowSummary.totalRefundedEscrow, escrowSummary.currency)}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-background/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Disputed Escrow</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(escrowSummary.totalDisputedEscrow, escrowSummary.currency)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
