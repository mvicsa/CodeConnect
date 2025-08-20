"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface MeetingCountdownProps {
  scheduledStartTime: string;
}

export const MeetingCountdown = ({ scheduledStartTime }: MeetingCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const scheduled = new Date(scheduledStartTime).getTime();
      const difference = scheduled - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft("Starting now!");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [scheduledStartTime]);

  const isStartingSoon = () => {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledStartTime).getTime();
    const difference = scheduled - now;
    return difference > 0 && difference <= 5 * 60 * 1000; // 5 minutes or less
  };

  const isOverdue = () => {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledStartTime).getTime();
    return now > scheduled;
  };

  if (isOverdue()) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Overdue
      </Badge>
    );
  }

  if (isStartingSoon()) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-orange-500">
        <Clock className="w-3 h-3" />
        Starting soon: {timeLeft}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Starts in: {timeLeft}
    </Badge>
  );
};
