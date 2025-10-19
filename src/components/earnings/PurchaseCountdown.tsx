"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, AlertTriangle } from "lucide-react";
import { PurchaseStatus } from "@/types/earnings";

interface PurchaseCountdownProps {
  expiresAt: string;
  status: PurchaseStatus;
  onExpired?: () => void;
}

export const PurchaseCountdown = ({ 
  expiresAt, 
  status, 
  onExpired 
}: PurchaseCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    total: number;
  }>({ minutes: 0, seconds: 0, total: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor(difference / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({
          minutes,
          seconds,
          total: difference
        });
        setIsExpired(false);
      } else {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 });
        setIsExpired(true);
        onExpired?.();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  // Don't show countdown if not pending or already expired
  if (status !== PurchaseStatus.PENDING || isExpired) {
    return null;
  }

  const isWarning = timeLeft.total < 5 * 60 * 1000; // Less than 5 minutes
  const isCritical = timeLeft.total < 2 * 60 * 1000; // Less than 2 minutes

  return (
    <Card className={`w-full ${isCritical ? 'border-red-200 bg-red-50 dark:bg-red-950' : isWarning ? 'border-orange-200 bg-orange-50 dark:bg-orange-950' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isCritical ? 'bg-red-100 dark:bg-red-900' : isWarning ? 'bg-orange-100 dark:bg-orange-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
            {isCritical ? (
              <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
            ) : (
              <Timer className={`w-4 h-4 ${isWarning ? 'text-orange-600' : 'text-yellow-600'}`} />
            )}
          </div>
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${isCritical ? 'text-red-800 dark:text-red-200' : isWarning ? 'text-orange-800 dark:text-orange-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              {isCritical ? 'Purchase expires soon!' : isWarning ? 'Purchase expires in' : 'Purchase expires in'}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              <div className={`text-lg font-mono font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-yellow-600'}`}>
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className={`text-xs ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-yellow-600'}`}>
                minutes
              </span>
            </div>
          </div>
        </div>
        
        {isCritical && (
          <p className="text-xs text-red-600 mt-2">
            Please complete your payment or it will be automatically cancelled.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

