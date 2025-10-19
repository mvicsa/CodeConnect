import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  title?: string;
  columns?: number;
  rows?: number;
  showPagination?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 4,
  rows = 5,
  showPagination = true,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle><Skeleton className="w-1/4 h-6" /></CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(columns)].map((_, i) => (
                <TableHead key={i}><Skeleton className="w-full h-4" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(rows)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(columns)].map((_, j) => (
                  <TableCell key={j}><Skeleton className="w-full h-8" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {showPagination && (
          <div className="flex justify-end mt-4">
            <Skeleton className="w-1/4 h-8" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
