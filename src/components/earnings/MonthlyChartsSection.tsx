import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SimpleBarChart } from './earnings-utils';

interface MonthlyChartsSectionProps {
  monthlyEarningsData: { month: string; earnings: number }[];
  monthlyPurchasesData: { month: string; purchases: number }[];
}

export const MonthlyChartsSection: React.FC<MonthlyChartsSectionProps> = ({
  monthlyEarningsData,
  monthlyPurchasesData,
}) => {
  return (
    <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-0">
      {monthlyEarningsData.length > 0 ? (
        <SimpleBarChart
          title="Monthly Earnings"
          dataKey="earnings"
          data={monthlyEarningsData}
        />
      ) : (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="grow-1 flex items-center justify-center">
            <p className="text-muted-foreground text-center pt-8 pb-12">No monthly earnings data available.</p>
          </CardContent>
        </Card>
      )}

      {monthlyPurchasesData.length > 0 ? (
        <SimpleBarChart
          title="Monthly Purchases"
          dataKey="purchases"
          data={monthlyPurchasesData}
        />
      ) : (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Purchases</CardTitle>
          </CardHeader>
          <CardContent className="grow-1 flex items-center justify-center">
            <p className="text-muted-foreground text-center pt-8 pb-12">No monthly purchases data available.</p>
          </CardContent>
        </Card>
      )}
    </CardContent>
  );
};
