"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Timer
} from "lucide-react";
import { 
  MeetingPurchase, 
  PurchaseStatus, 
  PURCHASE_MESSAGES
} from "@/types/earnings";

interface PurchaseActionsProps {
  purchase: MeetingPurchase;
  onPurchaseUpdate: (purchase: MeetingPurchase) => void;
  onRefresh?: () => void;
}

// Purchase Status Icons
const getStatusIcon = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case PurchaseStatus.COMPLETED:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case PurchaseStatus.FAILED:
      return <XCircle className="w-4 h-4 text-red-500" />;
    case PurchaseStatus.EXPIRED:
      return <Timer className="w-4 h-4 text-orange-500" />;
    case PurchaseStatus.CANCELLED:
      return <X className="w-4 h-4 text-gray-500" />;
    case PurchaseStatus.REFUNDED:
      return <DollarSign className="w-4 h-4 text-blue-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

// Purchase Status Colors
const getStatusColor = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case PurchaseStatus.COMPLETED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case PurchaseStatus.FAILED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case PurchaseStatus.EXPIRED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case PurchaseStatus.CANCELLED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case PurchaseStatus.REFUNDED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

// Countdown Timer Component
// const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
//   const [timeLeft, setTimeLeft] = useState<number>(0);

//   useState(() => {
//     const calculateTimeLeft = () => {
//       const now = new Date().getTime();
//       const expiry = new Date(expiresAt).getTime();
//       const difference = expiry - now;

//       if (difference > 0) {
//         const minutes = Math.floor(difference / (1000 * 60));
//         setTimeLeft(minutes);
//       } else {
//         setTimeLeft(0);
//       }
//     };

//     calculateTimeLeft();
//     const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

//     return () => clearInterval(interval);
//   });

//   if (timeLeft <= 0) return null;

//   return (
//     <div className="flex items-center gap-1 text-sm text-orange-600">
//       <Timer className="w-3 h-3" />
//       <span>Expires in {timeLeft}m</span>
//     </div>
//   );
// };

export const PurchaseActions = ({ 
  purchase
}: PurchaseActionsProps) => {
  return (
    <Card className="w-full bg-background/60 rounded-lg">
      <CardContent className="px-4 py-0">
        <div className="space-y-4">
          {/* Purchase Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(purchase.status)}
              <div>
                <h3 className="font-medium">{purchase.roomName || 'Meeting Purchase'}</h3>
                <p className="text-sm text-muted-foreground">
                  {purchase.amountPaid} {purchase.currencyUsed}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(purchase.status)}>
              {purchase.status.toUpperCase()}
            </Badge>
          </div>

          {/* Purchase Message */}
          <div className="p-3 bg-card rounded-lg">
            <p className="text-sm font-medium">
              {purchase.actions?.message || PURCHASE_MESSAGES[purchase.status]}
            </p>

            {/* Failure Reason */}
            {purchase.failureReason && (
              <p className="text-sm text-red-600 mt-1">
                Reason: {purchase.failureReason}
              </p>
            )}

            {/* Retry Count */}
            {purchase.retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Retry attempts: {purchase.retryCount}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

