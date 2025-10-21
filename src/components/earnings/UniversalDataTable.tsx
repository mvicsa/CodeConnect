import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Copy, MoreHorizontal, X, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import moment from 'moment';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { PurchaseCountdown } from './PurchaseCountdown';
import { PurchaseStatus, PURCHASE_MESSAGES, RecentActivity, EarningsHistory, EarningsEscrow, PurchasesHistory, WithdrawalHistory } from '@/types/earnings';
import { cancelPurchase, retryPurchase } from '@/lib/earnings';

// Status color utility function
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'completed':
    case 'released':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'processing':
    case 'refunded':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'disputed':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

interface UniversalDataTableProps {
  data: RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory[];
  type: 'recent-activities' | 'earnings-history' | 'purchases-history' | 'escrow' | 'withdrawals-history';
  formatCurrency: (amount: number | undefined | null, currency?: string) => string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onRefresh?: (params: { page?: number; limit?: number; search?: string }) => void;
  loading?: boolean;
}

// Generic Reusable Data Table Component
const DataTableWithActions: React.FC<{
  data: (RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory)[];
  columns: ColumnDef<RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory>[];
  filterColumn: string;
  formatCurrency?: (amount: number | undefined | null, currency?: string) => string;
  actionRenderer?: (row: RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory) => React.ReactNode;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onRefresh?: (params: { page?: number; limit?: number; search?: string }) => void;
  loading?: boolean;
}> = ({
  data,
  columns,
  filterColumn,
  actionRenderer,
  pagination,
  onRefresh,
  loading = false
}) => {
  // Add actions column if actionRenderer is provided
  const finalColumns: ColumnDef<RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory>[] = [
    ...columns,
    ...(actionRenderer ? [{
      id: "actions",
      enableHiding: false,
      cell: ({ row } : { row: { original: RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory } }) => (
        <div className="text-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actionRenderer(row.original as RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }] : [])
  ];

  return <DataTable
    columns={finalColumns}
    data={data as (RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory)[]}
    filterColumn={filterColumn}
    pagination={pagination}
    onRefresh={onRefresh}
    loading={loading}
  />;
};

export const UniversalDataTable: React.FC<UniversalDataTableProps> = ({ 
  data, 
  type, 
  formatCurrency, 
  pagination, 
  onRefresh, 
  loading = false 
}) => {

  // Normalize data for different table types
  const processedData = Array.isArray(data) && data.length > 0 ? data.map(item => {
    
    switch(type) {
      case 'escrow':
        return {
          ...item,
          _id: item._id,
          roomId: typeof item.roomId === 'string'
            ? { _id: item.roomId, name: item.title || 'N/A' }
            : item.roomId || { _id: '', name: item.title || 'N/A' },
          amount: item.amount || item.amountPaid || 0,
          currency: item.currency || item.currencyUsed || 'USD',
          type: item.type || 'creator',
          status: item.status || 'pending',
          date: item.date,
          releaseDate: item.releaseDate,
          title: item.title || (typeof item.roomId === 'object' ? item.roomId?.name : 'N/A')
        };
      case 'earnings-history':
        return {
          ...item,
          _id: item._id,
          title: item.title || 'N/A',
          amount: item.amount || item.amountPaid || 0,
          currency: item.currency || item.currencyUsed || 'USD',
          status: item.status || 'pending',
          date: item.date,
          releaseDate: item.releaseDate
        };
      case 'purchases-history':
        return {
          ...item,
          _id: item._id,
          title: item.title || 'N/A',
          amountPaid: item.amountPaid || item.amount || 0,
          currencyUsed: item.currencyUsed || item.currency || 'USD',
          status: item.status || 'pending',
          date: item.date,
          purchaseDate: item.purchaseDate || item.date
        };
      case 'recent-activities':
        return {
          ...item,
          _id: item._id || `${item.date}-${item.roomId || ''}-${item.amount}`,
          type: item.type || 'unknown',
          description: item.description || '',
          amount: item.amount || 0,
          currency: item.currency || 'USD',
          date: item.date,
          title: item.title || '',
          roomId: item.roomId || '',
          status: item.status || '',
          releaseDate: item.releaseDate
        };
      case 'withdrawals-history':
        return {
          ...item,
          _id: item._id,
          title: item.description || 'Withdrawal',
          amount: item.amount || 0,
          currency: item.currency || 'USD',
          status: item.status || 'pending',
          date: item.createdAt,
          processedAt: item.processedAt,
          failureReason: item.failureReason
        };
      default:
        return item;
    }
  }) : [];

  const getColumns = (): ColumnDef<RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory>[] => {
    const baseColumns = [
      {
        id: "select",
        header: ({ table } : { table: { getIsAllPageRowsSelected: () => boolean, getIsSomePageRowsSelected: () => boolean, toggleAllPageRowsSelected: (value: boolean) => void } }) => (
          <div className="px-2">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row } : { row: { getIsSelected: () => boolean, toggleSelected: (value: boolean) => void } }) => (
          <div className="px-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "roomId",
        accessorFn: (row: { roomId: { _id: string, name: string } }) => row.roomId?._id || row.roomId || '',
        header: () => null,
        cell: () => null,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        accessorFn: (row: { title: string, roomId: { _id: string, name: string } }) => row.title || row.roomId?.name || 'N/A',
        header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row } : { row: { getValue: (key: string) => string, original: { _id: string, roomId: { _id: string, name: string } } } }) => {
          const title = row.getValue("title") || row.original.roomId?.name || 'N/A';
          const roomIdValue = row.getValue("roomId") as { _id: string, name: string } | string;
          // Extract roomId from the object structure
          const roomId = typeof roomIdValue === 'object' && roomIdValue?._id 
            ? roomIdValue._id 
            : typeof roomIdValue === 'string' 
            ? roomIdValue 
            : row.original.roomId?._id || row.original._id;
          
          // Ensure roomId is a string
          const roomIdString = typeof roomId === 'string' ? roomId : String(roomId);
          return (
            roomId ? (
              <Link
                href={`/meeting/${roomIdString}`}
                className="px-2.5 hover:underline hover:text-primary transition-colors"
              >
                {title}
              </Link>
            ) : (
              <div className="px-2.5">
                {title}
              </div>
            )
          );
        },
      },
      // Hidden column for filtering escrow data
      ...(type === 'escrow' ? [{
        id: "titleFilter",
        accessorKey: "titleFilter",
        accessorFn: (row: { roomId: { _id: string, name: string }, title: string }) => row.roomId?.name || row.title || 'N/A',
        header: () => null,
        cell: () => null,
        enableHiding: false,
        enableSorting: false,
      }] : [])
    ];

    // Transaction ID Column
    const transactionIdColumn = {
      accessorKey: "transactionId",
      header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transaction ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row } : { row: { original: { _id: string } } }) => {
        const transactionId = row.original._id;
        return (
          <div className="px-2.5 font-mono text-xs flex items-center space-x-2">
            <span>{transactionId?.slice(0, 10)}...</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(transactionId);
                toast.success('Transaction ID copied', {
                  description: transactionId,
                  duration: 2000,
                });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    };

    const typeSpecificColumns = {
      'recent-activities': [
        {
          accessorKey: "type",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Type
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="capitalize px-2.5">{row.getValue("type")}</div>
          ),
        },
        {
          accessorKey: "status",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              <Badge className={`capitalize ${getStatusColor(row.getValue("status"))}`}>
                {row.getValue("status")}
              </Badge>
            </div>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              {moment(row.getValue("date")).format('MMM DD, YYYY HH:mm A')}
            </div>
          ),
        },
        // {
        //   accessorKey: "releaseDate",
        //   header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
        //     <Button
        //       variant="ghost"
        //       size="sm"
        //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //     >
        //       Release Date
        //       <ArrowUpDown className="ml-2 h-4 w-4" />
        //     </Button>
        //   ),
        //   cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
        //     <div className="px-2.5">
        //       {moment(row.getValue("releaseDate")).format('MMM DD, YYYY HH:mm A')}
        //     </div>
        //   ),
        // }
      ],
      'earnings-history': [
        {
          accessorKey: "status",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              <Badge className={`capitalize ${getStatusColor(row.getValue("status"))}`}>
                {row.getValue("status")}
              </Badge>
            </div>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              {moment(row.getValue("date")).format('MMM DD, YYYY HH:mm A')}
            </div>
          ),
        },
        {
          accessorKey: "releaseDate",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Release Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => {
            const date = row.getValue("releaseDate");
            return (
              <div className="px-2.5">
                {moment(date as string).format('MMM DD, YYYY HH:mm A')}
              </div>
            );
          },
        }
      ],
      'purchases-history': [
        {
          accessorKey: "status",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              <PurchaseStatusBadge status={row.getValue("status") as PurchaseStatus} />
            </div>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              {moment(row.getValue("date")).format('MMM DD, YYYY HH:mm A')}
            </div>
          ),
        },
        {
          accessorKey: "message",
          header: "Message",
          cell: ({ row } : { row: { original: PurchasesHistory } }) => {
            const purchase = row.original;
            const message = purchase.actions?.message || PURCHASE_MESSAGES[purchase.status as PurchaseStatus];
            return (
              <div className="px-2.5 max-w-xs">
                <p className="text-sm text-muted-foreground truncate" title={message}>
                  {message}
                </p>
                {purchase.status === PurchaseStatus.PENDING && purchase.expiresAt && (
                  <PurchaseCountdown 
                    expiresAt={purchase.expiresAt} 
                    status={purchase.status}
                    onExpired={() => {
                      toast.info("Purchase session expired");
                      // Trigger refresh if available
                    }}
                  />
                )}
              </div>
            );
          },
        },
        {
          accessorKey: "purchaseDate",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Purchase Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => {
            const date = row.getValue("purchaseDate");
            return (
              <div className="px-2.5">
                {moment(date as string).format('MMM DD, YYYY HH:mm A')}
              </div>
            );
          },
        }
      ],
      'escrow': [
        {
          accessorKey: "type",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Type
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="capitalize px-2.5">{row.getValue("type")}</div>
          ),
        },
        {
          accessorKey: "status",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              <Badge className={`capitalize ${getStatusColor(row.getValue("status"))}`}>
                {row.getValue("status")}
              </Badge>
            </div>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              {moment(row.getValue("date")).format('MMM DD, YYYY HH:mm A')}
            </div>
          ),
        },
        {
          accessorKey: "releaseDate",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Release Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => {
            const date = row.getValue("releaseDate");
            return (
              <div className="px-2.5">
                {moment(date as string).format('MMM DD, YYYY HH:mm A')}
              </div>
            );
          },
        }
      ],
      'withdrawals-history': [
        {
          accessorKey: "status",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              <Badge className={`capitalize ${getStatusColor(row.getValue("status"))}`}>
                {row.getValue("status")}
              </Badge>
            </div>
          ),
        },
        {
          accessorKey: "date",
          header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row } : { row: { getValue: (key: string) => string } }) => (
            <div className="px-2.5">
              {moment(row.getValue("date")).format('MMM DD, YYYY HH:mm A')}
            </div>
          ),
        },
        {
          accessorKey: "failureReason",
          header: "Failure Reason",
          cell: ({ row } : { row: { getValue: (key: string) => string, original: { status: string } } }) => {
            const reason = row.getValue("failureReason");
            const status = row.original.status;
            return (
              <div className="max-w-xs truncate">
                {status === 'failed' && reason ? reason : 'N/A'}
              </div>
            );
          },
        },
      ]
    };

    const amountColumn = {
      accessorKey: type === 'earnings-history' ? "amountPaid" : "amount",
      header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row } : { row: { getValue: (key: string) => string, original: { currencyUsed: string, currency: string } } }) => {
        const amount = row.getValue(type === 'earnings-history' ? "amountPaid" : "amount");
        const currency = type === 'earnings-history'
          ? row.original.currencyUsed
          : row.original.currency;
        return (
          <div className="font-medium px-2.5">
            {formatCurrency(amount as unknown as number, currency)}
          </div>
        );
      },
    };


    const descriptionColumn = {
      accessorKey: "description",
      header: ({ column } : { column: { toggleSorting: (value: boolean) => void, getIsSorted: () => string | undefined } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row } : { row: { getValue: (key: string) => string } }) => <div className="px-2.5">{row.getValue("description")}</div>,
    };

    return [
      ...baseColumns,
      amountColumn,
      ...[transactionIdColumn],
      ...(type === 'recent-activities' ? [descriptionColumn] : []),
      ...(typeSpecificColumns[type] || [])
    ].filter(Boolean) as ColumnDef<RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory>[];
  };

  const actionRenderer = (row: { type: string, description: string, amount: number, currency: string, date: string, releaseDate: string, status: string, _id: string, title: string, amountPaid: number, currencyUsed: string, purchaseDate: string, roomId: { _id: string, name: string }, transactionId: string, actions: { canCancel: boolean, canRetry: boolean }, createdAt: string, processedAt: string, failureReason: string }) => {
    const getDetails = () => {
      switch(type) {
        case 'recent-activities':
          return {
            copyText: `${row.type} - ${row.description} - ${formatCurrency(row.amount, row.currency)} - Date: ${moment(row.date).format('MMM DD, YYYY HH:mm A')} - Release: ${moment(row.releaseDate).format('MMM DD, YYYY HH:mm A')}`,
            toastTitle: 'Activity Details',
            toastDescription: `
              Type: ${row.type}
              Description: ${row.description}
              Amount: ${formatCurrency(row.amount, row.currency)}
              Status: ${row.status}
              Date: ${moment(row.date).format('MMM DD, YYYY HH:mm A')}
              Release Date: ${moment(row.releaseDate).format('MMM DD, YYYY HH:mm A')}
            `
          };
        case 'earnings-history':
          return {
            copyText: `Transaction ID: ${row._id}\nRoom: ${row.title} - Amount: ${formatCurrency(row.amount, row.currency)} - Status: ${row.status}`,
            toastTitle: 'Earnings Details',
            toastDescription: `
              Transaction ID: ${row._id}
              Room: ${row.title || 'N/A'}
              Amount: ${formatCurrency(row.amount, row.currency)}
              Status: ${row.status}
              Release Date: ${moment(row.releaseDate).format('MMM DD, YYYY HH:mm A')}
            `
          };
        case 'purchases-history':
          return {
            copyText: `Transaction ID: ${row.transactionId}\nRoom: ${row.title} - Amount: ${formatCurrency(row.amountPaid, row.currencyUsed)} - Status: ${row.status}`,
            toastTitle: 'Purchase Details',
            toastDescription: `
              Transaction ID: ${row.transactionId}
              Room: ${row.title || 'N/A'}
              Amount: ${formatCurrency(row.amountPaid, row.currencyUsed)}
              Status: ${row.status}
              Purchase Date: ${moment(row.purchaseDate).format('MMM DD, YYYY HH:mm A')}
            `
          };
        case 'escrow':
          return {
            copyText: `Escrow ID: ${row._id}\nRoom: ${row.roomId?.name || 'N/A'} - Amount: ${formatCurrency(row.amount, row.currency)} - Status: ${row.status}`,
            toastTitle: 'Escrow Details',
            toastDescription: `
              Escrow ID: ${row._id}
              Room: ${row.roomId?.name || 'N/A'}
              Type: ${row.type || 'creator'}
              Amount: ${formatCurrency(row.amount, row.currency)}
              Status: ${row.status}
              Release Date: ${moment(row.releaseDate).format('MMM DD, YYYY HH:mm A')}
            `
          };
        case 'withdrawals-history':
          return {
            copyText: `Withdrawal ID: ${row._id}\nAmount: ${formatCurrency(row.amount, row.currency)} - Status: ${row.status}`,
            toastTitle: 'Withdrawal Details',
            toastDescription: `
              Withdrawal ID: ${row._id}
              Amount: ${formatCurrency(row.amount, row.currency)}
              Status: ${row.status}
              Description: ${row.description || 'N/A'}
              Created At: ${moment(row.createdAt).format('MMM DD, YYYY HH:mm A')}
              ${row.processedAt ? `Processed At: ${moment(row.processedAt).format('MMM DD, YYYY HH:mm A')}` : ''}
              ${row.failureReason ? `Failure Reason: ${row.failureReason}` : ''}
            `
          };
      }
    };

    const details = getDetails();

    // Handle purchase actions
    const handleCancelPurchase = async () => {
      try {
        await cancelPurchase(row._id);
        toast.success('Purchase cancelled successfully');
        onRefresh?.({ page: 1, limit: 10 });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(errorMessage || 'Failed to cancel purchase');
      }
    };

    const handleRetryPurchase = async () => {
      try {
        await retryPurchase(row._id);
        toast.success('Purchase retry initiated');
        onRefresh?.({ page: 1, limit: 10 });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(errorMessage || 'Failed to retry purchase');
      }
    };

    return (
      <>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(details.copyText);
            toast.success('Details copied');
          }}
        >
          Copy details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            toast.info(details.toastTitle, {
              description: details.toastDescription,
              duration: 5000,
            });
          }}
        >
          View details
        </DropdownMenuItem>
        
        {/* Purchase Actions */}
        {type === 'purchases-history' && (
          <>
            {row.actions?.canCancel && (
              <DropdownMenuItem
                onClick={handleCancelPurchase}
                className="text-red-600 focus:text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Purchase
              </DropdownMenuItem>
            )}
            {row.actions?.canRetry && (
              <DropdownMenuItem
                onClick={handleRetryPurchase}
                className="text-blue-600 focus:text-blue-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Purchase
              </DropdownMenuItem>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <DataTableWithActions
      data={processedData as (RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory)[]}
      columns={getColumns() as ColumnDef<RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory>[]}
      filterColumn={type === 'recent-activities' 
        ? "title" 
        : type === 'escrow' 
          ? "title" 
          : type === 'withdrawals-history'
            ? "description" // Filter by description for withdrawals
            : "title"}
      formatCurrency={formatCurrency}
      actionRenderer={actionRenderer as unknown as (row: RecentActivity | EarningsHistory | PurchasesHistory | EarningsEscrow | WithdrawalHistory) => React.ReactNode}
      pagination={pagination}
      onRefresh={onRefresh}
      loading={loading}
    />
  );
};
