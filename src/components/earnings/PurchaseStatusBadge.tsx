"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer, 
  X, 
  DollarSign,
  AlertCircle 
} from "lucide-react";
import { PurchaseStatus } from "@/types/earnings";

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PurchaseStatusBadge = ({ 
  status, 
  showIcon = true, 
  size = "md" 
}: PurchaseStatusBadgeProps) => {
  const getStatusConfig = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.PENDING:
        return {
          icon: <Clock className="w-3 h-3" />,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          text: "Processing"
        };
      case PurchaseStatus.COMPLETED:
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          text: "Completed"
        };
      case PurchaseStatus.FAILED:
        return {
          icon: <XCircle className="w-3 h-3" />,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          text: "Failed"
        };
      case PurchaseStatus.EXPIRED:
        return {
          icon: <Timer className="w-3 h-3" />,
          className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
          text: "Expired"
        };
      case PurchaseStatus.CANCELLED:
        return {
          icon: <X className="w-3 h-3" />,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
          text: "Cancelled"
        };
      case PurchaseStatus.REFUNDED:
        return {
          icon: <DollarSign className="w-3 h-3" />,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          text: "Refunded"
        };
      default:
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
          text: "Unknown"
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2"
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} flex items-center gap-1`}>
      {showIcon && config.icon}
      {config.text}
    </Badge>
  );
};

