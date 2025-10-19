import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Custom Tooltip for Recharts
export const CustomTooltip = ({ active, payload, label }: { active: boolean; payload: { dataKey: string; value: number }[]; label: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {payload[0].dataKey}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// Format currency helper function
export const formatCurrency = (amount: unknown, currency: string = 'USD') => {
  // Convert to number, handling various input types
  const numAmount = amount === null || amount === undefined ? 0 :
                    typeof amount === 'number' ? amount :
                    typeof amount === 'string' ? parseFloat(amount) :
                    0;

  return `${numAmount.toFixed(2)} ${currency}`;
};

// Simplified Chart Component
export const SimpleBarChart: React.FC<{
  title: string;
  data: { month: string; [key: string]: number | string }[];
  dataKey: string;
}> = ({ title, data, dataKey }) => {
  // Ensure data is an array and has elements
  const chartData = Array.isArray(data) && data.length > 0 ? data : [];

  // If no data, return a Card with a "No data" message
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">No {title.toLowerCase()} data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] ps-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }} />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }} />
            <Tooltip content={<CustomTooltip active={true} payload={[]} label={''} />} cursor={{ fill: 'var(--accent)' }} />
            <Bar
              dataKey={dataKey}
              fill="var(--primary)"
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
