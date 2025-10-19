import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatCurrency } from './earnings-utils';

interface WithdrawSectionProps {
  availableBalance: number;
  currency: string;
  withdrawLoading: boolean;
  onWithdraw: (amount: number, currency: string) => Promise<void>; // Updated signature
  onRefreshData: () => void;
}

export const WithdrawSection: React.FC<WithdrawSectionProps> = ({
  availableBalance,
  currency,
  withdrawLoading,
  onWithdraw,
  onRefreshData,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount to withdraw.');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Withdrawal amount exceeds available balance.');
      return;
    }

   
    // For Test
    await onWithdraw(withdrawAmount as number, currency); // Pass currency
    setWithdrawAmount('');
    onRefreshData();

    // try {
    //   await onWithdraw(withdrawAmount as number, currency); // Pass currency
    //   toast.success('Withdrawal request submitted successfully!');
    //   setWithdrawAmount('');
    //   onRefreshData();
    // } catch (err) {
    //   toast.error('Failed to process withdrawal');
    // }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Earnings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your available balance for withdrawal is {formatCurrency(availableBalance, currency)}.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Input
            type="number"
            placeholder="Amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value ? parseFloat(e.target.value) : '')}
            min="0"
            step="0.01"
            disabled={withdrawLoading}
          />
          <Button
            onClick={handleWithdraw}
            disabled={
              withdrawLoading ||
              !withdrawAmount ||
              typeof withdrawAmount !== 'number' ||
              withdrawAmount <= 0 ||
              withdrawAmount > availableBalance
            }
          >
            {withdrawLoading ? 'Processing...' : 'Withdraw Funds'}
          </Button>
          {typeof withdrawAmount === 'number' && withdrawAmount > availableBalance && (
            <p className="text-sm text-red-500">
              Amount exceeds available balance
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
