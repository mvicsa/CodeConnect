"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CircleDollarSignIcon, Users } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Purchaser {
  purchaseId: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
  amountPaid: number;
  currency: string;
  purchasedAt: string;
  status: string;
}

interface PurchasersListProps {
  roomId: string;
  roomName: string;
  creatorId: string;
}

// Skeleton Component
const PurchasersListSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Total Revenue and Purchasers Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 justify-between items-center mb-4">
        <div className="flex justify-between items-center bg-background/50 p-4 rounded-lg border">
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="flex justify-between items-center bg-background/60 p-4 rounded-lg border">
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>

      {/* Purchasers List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div 
            key={item} 
            className="flex items-center justify-between p-3 rounded-lg bg-background/30"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12 ms-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PurchasersList = ({ roomId, creatorId }: PurchasersListProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [purchasers, setPurchasers] = useState<Purchaser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPurchasers = useCallback(async (page?: number, limit?: number) => {
    if (!roomId || !user) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/livekit/rooms/${roomId}/purchasers`, {
        params: { page, limit }
      });

      const { purchasers, pagination, totalRevenue } = response.data;

      setPurchasers(purchasers);
      setPagination(pagination);
      setTotalRevenue(totalRevenue);
    } catch {
      toast.error("Failed to load purchasers");
    } finally {
      setLoading(false);
    }
  }, [roomId, user]);

  useEffect(() => {
    fetchPurchasers();
  }, [roomId, user, creatorId, fetchPurchasers]);

  const handlePageChange = (newPage: number) => {
    fetchPurchasers(newPage);
  };

  if (loading) {
    return <PurchasersListSkeleton />;
  }
  return (
    <div className="space-y-4">
      {/* Total Revenue and Purchasers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 justify-between items-center mb-4">
        <div className="flex justify-between items-center bg-background/50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Purchasers</p>
            <p className="text-xl font-bold">{pagination.total}</p>
          </div>
          <Users className="w-6 h-6" />
        </div>
        <div className="flex justify-between items-center bg-background/60 p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-xl font-bold">
              {totalRevenue.toLocaleString()} {purchasers[0]?.currency || 'USD'}
            </p>
          </div>
          <CircleDollarSignIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Purchasers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {purchasers.map((purchaser) => (
          <div 
            key={purchaser.purchaseId} 
            className="flex items-center justify-between p-3 rounded-lg bg-background/60 hover:bg-background/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={purchaser.avatar} />
                <AvatarFallback>
                  {purchaser.firstName?.[0]}{purchaser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  href={`/profile/${purchaser.username}`} 
                  className="font-medium hover:underline"
                >
                  {purchaser.firstName} {purchaser.lastName}
                </Link>
                <p className="text-xs text-muted-foreground">{purchaser.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {purchaser.amountPaid} {purchaser.currency}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(purchaser.purchasedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
