"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface MeetingCountdownProps {
  scheduledStartTime: string;
  onCountdownComplete?: () => void;
}

export const MeetingCountdown = ({ scheduledStartTime, onCountdownComplete }: MeetingCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [status, setStatus] = useState<'upcoming' | 'starting-soon' | 'started'>('upcoming');

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledStartTime).getTime();
    const difference = scheduled - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      // Update status based on time remaining
      if (difference <= 5 * 60 * 1000) { // 5 minutes or less
        setStatus('starting-soon');
      } else {
        setStatus('upcoming');
      }
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setStatus('started');
      
      // Notify parent that countdown is complete
      if (onCountdownComplete) {
        onCountdownComplete();
      }
    }
  }, [scheduledStartTime, onCountdownComplete]);

  useEffect(() => {
    // Calculate immediately
    calculateTimeLeft();
    
    // Set up interval that runs every second
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(timer);
    };
  }, [calculateTimeLeft]); // Empty dependency array to run only once

  const formatTimeUnit = (value: number, unit: string) => {
    const isSeconds = unit === 'Seconds';
    const isUrgent = status === 'starting-soon' && isSeconds;
    
    return (
      <div className="flex flex-col items-center justify-center min-w-[40px]">
        <motion.div
          key={`${unit}-${value}`}
          className={`flex items-center justify-center flex-col w-14 h-14 text-sm sm:w-24 sm:h-24 sm:text-3xl lg:w-32 lg:h-32 lg:text-4xl font-bold bg-accent rounded-lg p-2`}
          initial={{ scale: 0.9 }}
          animate={{ 
            scale: 1,
            color: isUrgent ? 'hsl(var(--red-600))' : 'hsl(var(--primary))'
          }}
          transition={{ 
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          {value.toString().padStart(2, '0')}
          <span className={`text-[8px] sm:text-xs mt-1 text-muted-foreground`}>
            {unit}
          </span>
        </motion.div>
      </div>
    );
  };

  // const getStatusConfig = () => {
  //   switch (status) {
  //     case 'upcoming':
  //       return {
  //         icon: <Clock className="w-4 h-4" />,
  //         variant: 'outline' as const,
  //         className: 'flex items-center gap-2',
  //         title: 'Starts in:',
  //       };
  //     case 'starting-soon':
  //       return {
  //         icon: <AlertTriangle className="w-4 h-4" />,
  //         variant: 'default' as const,
  //         className: 'flex items-center gap-2 bg-orange-500 hover:bg-orange-600',
  //         title: 'Starting soon!',
  //       };
  //     case 'started':
  //       return {
  //         icon: <Play className="w-4 h-4" />,
  //         variant: 'default' as const,
  //         className: 'flex items-center gap-2 bg-green-500 hover:bg-green-600',
  //         title: 'Meeting started!',
  //       };
  //     default:
  //       return {
  //         icon: <Clock className="w-4 h-4" />,
  //         variant: 'outline' as const,
  //         className: 'flex items-center gap-2',
  //         title: 'Starts in:',
  //       };
  //   }
  // };

  // const statusConfig = getStatusConfig();

  // if (status === 'started') {
  //   return (
  //     <Badge variant={statusConfig.variant} className={statusConfig.className}>
  //       {statusConfig.icon}
  //       {statusConfig.title}
  //     </Badge>
  //   );
  // }

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <h1 className="text-2xl font-bold text-center uppercase mb-5">Meeting starts in</h1>

      {/* Countdown Display - Only this has motion! */}
      <div className="flex items-center justify-center gap-3">
        {formatTimeUnit(timeLeft.days, 'Days')}
        {formatTimeUnit(timeLeft.hours, 'Hours')}
        {formatTimeUnit(timeLeft.minutes, 'Minutes')}
        {formatTimeUnit(timeLeft.seconds, 'Seconds')}
      </div>

      {/* Simple urgency message */}
      {/* {status === 'starting-soon' && (
        <p className="flex items-center justify-center gap-2 text-sm text-primary text-center font-medium">
          <AlertTriangle className="w-4 h-4" />
          Meeting starts in less than 5 minutes!
        </p>
      )} */}
    </div>
  );
};
