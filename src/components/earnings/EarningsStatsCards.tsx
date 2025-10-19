import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingBag,
  Wallet,
  Hourglass,
} from 'lucide-react';
import { formatCurrency } from './earnings-utils';

interface EarningsStatsCardsProps {
  stats: {
    totalEarnings: number;
    totalSpent: number;
    availableBalance: number;
    pendingEarnings: number;
    currency: string;
  };
}

export const EarningsStatsCards: React.FC<EarningsStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalEarnings, stats.currency)}
          </div>
          <p className="text-xs text-muted-foreground">Total Earnings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalSpent, stats.currency)}
          </div>
          <p className="text-xs text-muted-foreground">Total Purchases</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.availableBalance, stats.currency)}
          </div>
          <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.pendingEarnings, stats.currency)}
          </div>
          <p className="text-xs text-muted-foreground">In escrow</p>
        </CardContent>
      </Card>
    </div>
  );
};
