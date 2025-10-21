"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export function ReconnectionIndicator() {
  const isConnected = useSelector((state: RootState) => state.chat.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasConnected = React.useRef(false);
  const reconnectedTimeRef = React.useRef<number | null>(null);

  // Show reconnecting status when connection is lost but was previously connected
  useEffect(() => {
    if (!isConnected && wasConnected.current) {
      setIsReconnecting(true);
      setShowReconnected(false);
      reconnectedTimeRef.current = null;
    } else if (isConnected && wasConnected.current) {
      // Only show reconnected message if we were previously reconnecting
      if (isReconnecting) {
        setIsReconnecting(false);
        setShowReconnected(true);
        reconnectedTimeRef.current = Date.now();
      }
    } else if (isConnected) {
      // First connection - just mark as connected
      wasConnected.current = true;
    }
  }, [isConnected, isReconnecting]);

  // Check if 5 seconds have passed since reconnection
  useEffect(() => {
    if (showReconnected && reconnectedTimeRef.current) {
      const interval = setInterval(() => {
        if (Date.now() - reconnectedTimeRef.current! > 5000) {
          setShowReconnected(false);
          reconnectedTimeRef.current = null;
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showReconnected]);

  if (!isReconnecting && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-accent text-accent-foreground p-3 rounded-lg shadow-lg">
      <div className="flex items-center justify-center gap-2">
        {isReconnecting ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
        ) : (
          <div className="animate-pulse h-4 w-4 border-2 bg-success rounded-full"></div>
        )}
      </div>
    </div>
  );
}
