import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RecentActivitiesSkeleton from './RecentActivitiesSkeleton';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Earnings Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"><Skeleton className="w-3/4 h-5" /></CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-1/2 h-8 mb-1" />
              <Skeleton className="w-3/4 h-4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Charts Section Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-1/3 h-6" /></CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>

      {/* Recent Activities Table Skeleton */}
      <RecentActivitiesSkeleton />
    </div>
  );
};

export default DashboardSkeleton;
