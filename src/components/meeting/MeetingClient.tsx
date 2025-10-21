"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Plus,
  Star,
  Loader2,
  Sparkles,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Container from "@/components/Container";
import { User } from "@/types/user";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchFollowing } from '@/store/slices/followSlice';
import {
  fetchRooms,
  fetchPublicSessions,
  fetchSessionHistory,
  discoverSessions,
  createRoom,
  updateRoom,
  deleteRoom,
  createCheckoutSession,
  type Room as ReduxRoom,
  type PublicSession,
  type CreateRoomData,
  type UpdateRoomData,
  type DiscoverSessionsFilters,
  Room,
  SessionHistory
} from '@/store/slices/meetingSlice';
import { RoomDialog } from "./RoomDialog";
import { VideoConferenceComponent } from "./VideoConference";
import { RoomCard } from "./RoomCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SessionsSearch } from "./SessionsSearch";
import { useContext } from 'react';
import { SocketContext } from '@/store/Provider';
import axiosInstance from '@/lib/axios';
import axios from 'axios';
import { SessionRatingDialog } from '@/components/rating';
import { RoomCardSkeleton } from "./RoomCardSkeleton";
import { CancelRoomModal } from "./CancelRoomModal";


export const MeetingClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    rooms,
    createLoading, 
    updateLoading,
    discoverSessionsLoading,
    sessionHistory: { sessions: sessionHistory, pagination: historyPagination, filters: historyFiltersData },
    sessionHistoryLoading, 
    cancelLoading,
  } = useSelector((state: RootState) => state.meeting);

  const { user } = useSelector((state: RootState) => state.auth);
  const { items: followedUsers } = useSelector((state: RootState) => state.follow.following);
  
  const [token, setToken] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ReduxRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [editingRoom, setEditingRoom] = useState<ReduxRoom | null>(null);
  const [originalInvitedUsers, setOriginalInvitedUsers] = useState<User[]>([]);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxParticipants: 10,
    isPaid: false,
    price: undefined as number | undefined,
    currency: 'USD' as string,
    invitedUsers: [] as User[], // Array of User objects for UI
    inviteEmail: '',
    scheduledStartTime: undefined as string | undefined
  });
  // const [sessionsSearchQuery, setSessionsSearchQuery] = useState("");

  // Filter states for discover sessions
  const [discoverFilters, setDiscoverFilters] = useState<DiscoverSessionsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Filter states for history sessions
  const [historyFilters, setHistoryFilters] = useState<DiscoverSessionsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'lastJoined',
    sortOrder: 'desc',
    status: 'all',
    type: 'all',
    paymentStatus: 'all',
  });

  // State for discover sessions data
  const [discoverSessionsData, setDiscoverSessionsData] = useState<Room[]>([]);
  const [discoverSessionsPagination, setDiscoverSessionsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [isLoadingDiscoverMore, setIsLoadingDiscoverMore] = useState(false);
  // const prevDiscoverFiltersRef = useRef<DiscoverSessionsFilters | null>(null); // To compare filters changes

  // New state for purchase status loading
  // const [isLoadingPurchaseStatus, setIsLoadingPurchaseStatus] = useState(false);

  const resetNewRoomData = () => {
    setNewRoomData({
      name: '',
      description: '',
      isPrivate: false,
      maxParticipants: 10,
      isPaid: false,
      price: undefined,
      currency: 'USD',
      invitedUsers: [],
      inviteEmail: '',
      scheduledStartTime: undefined
    });
  };
  
  const [roomToDelete, setRoomToDelete] = useState<ReduxRoom | null>(null);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  
  // Separate loading state for load more operations
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Rating dialog state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingSessionData, setRatingSessionData] = useState<{
    sessionId: string;
    roomName: string;
    creatorName: string;
    creatorId: string;
  } | null>(null);

  // Payment state
  // const [hasPurchasedMeeting, setHasPurchasedMeeting] = useState(false);

  // New state for cancel room dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [roomToCancel, setRoomToCancel] = useState<ReduxRoom | null>(null);

  // Function to handle rating a session
  const handleRateSession = useCallback((session: SessionHistory) => {
    if (session.createdBy?._id && session.createdBy._id !== user?._id) {
      const creatorName = `${session.createdBy.firstName} ${session.createdBy.lastName}`;
      
      setRatingSessionData({
        sessionId: session.roomId,
        roomName: session.roomName,
        creatorName,
        creatorId: session.createdBy._id,
      });
      setShowRatingDialog(true);
    }
  }, [user?._id]);

  const t = useTranslations("meeting");
  const socket = useContext(SocketContext);

  // // Check socket connection status
  // useEffect(() => {
  //   if (socket) {
  //     console.log('🔌 Socket connected:', socket.connected);
      
  //     socket.on('connect', () => {
  //       console.log('✅ Socket connected successfully');
  //     });
      
  //     socket.on('disconnect', () => {
  //       console.log('❌ Socket disconnected');
  //     });
      
  //     socket.on('connect_error', (error: Error) => {
  //       console.error('❌ Socket connection error:', error);
  //     });
  //   }
  // }, [socket]);

  // Removed: Function to fetch and calculate average rating for a session
  // const fetchSessionRating = useCallback(async (sessionId: string) => {
  //   if (sessionRatings[sessionId] !== undefined) return; // Already fetched
  //   
  //   try {
  //     const ratings = await ratingService.getSessionRatings(sessionId);
  //     if (ratings && ratings.length > 0) {
  //       const totalRating = ratings.reduce((sum, rating) => sum + rating.overallRating, 0);
  //       const averageRating = totalRating / ratings.length;
  //       setSessionRatings(prev => ({ ...prev, [sessionId]: averageRating }));
  //       setSessionRatingCounts(prev => ({ ...prev, [sessionId]: ratings.length }));
  //     } else {
  //       setSessionRatings(prev => ({ ...prev, [sessionId]: 0 })); // No ratings
  //       setSessionRatingCounts(prev => ({ ...prev, [sessionId]: 0 }));
  //     }
  //   } catch {
  //     toast.error(`Failed to fetch ratings`);
  //     setSessionRatings(prev => ({ ...prev, [sessionId]: 0 }));
  //     setSessionRatingCounts(prev => ({ ...prev, [sessionId]: 0 }));
  //   }
  // }, [sessionRatings]);

  // Function to load more session history
  const handleLoadMoreSessions = useCallback(async () => {
    if (!historyPagination?.hasNext || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = (historyPagination?.page || 0) + 1;
      
      await dispatch(fetchSessionHistory({ 
        page: nextPage, 
        limit: 10, 
        loadMore: true,
        sortBy: historyFilters.sortBy,
        sortOrder: historyFilters.sortOrder,
        status: historyFilters.status,
        type: historyFilters.type,
        paymentStatus: historyFilters.paymentStatus,
        search: historyFilters.search
      }));
    } catch {
      toast.error('Failed to load more sessions');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, dispatch, historyFilters.sortBy, historyFilters.sortOrder, historyFilters.status, historyFilters.type, historyFilters.paymentStatus, historyFilters.search, historyPagination?.page, historyPagination?.hasNext]);

  // Function to render star rating display
  // const renderStarRating = useCallback((rating: number, size: 'sm' | 'md' = 'md') => {
  //   const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  //   const stars = [];
    
  //   for (let i = 1; i <= 5; i++) {
  //     if (i <= rating) {
  //       // Filled star
  //       stars.push(
  //         <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
  //       );
  //     } else if (i - 0.5 <= rating) {
  //       // Half star
  //       stars.push(
  //         <div key={i} className="relative">
  //           <Star className={`${starSize} text-gray-300`} />
  //           <Star className={`${starSize} fill-yellow-400 text-yellow-400 absolute inset-0 overflow-hidden`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
  //         </div>
  //       );
  //     } else {
  //       // Empty star
  //       stars.push(
  //         <Star key={i} className={`${starSize} text-gray-300`} />
  //       );
  //     } 
  //   }
    
  //   return (
  //     <div className="flex items-center justify-center gap-1">
  //       {stars}
  //       <span className={`ms-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
  //         {rating.toFixed(1)}
  //       </span>
  //     </div>
  //   );
  // }, []); // Added missing dependency array to useCallback

  // useEffect(() => {
  //   console.log('Current User:', user);
  //   console.log('Followed Users:', followedUsers);
  // }, [user, followedUsers]);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        if (user?._id) {
          const response = await axiosInstance.get(`/users/${user._id}/following`);

          if (response.status === 200) {
            const followedUsers = response.data;
            
            dispatch(fetchFollowing.fulfilled({ 
              items: followedUsers, 
              limit: followedUsers.length, 
              skip: 0 
            }, 'fetchFollowing/fulfilled', { userId: user._id }));
          } else {
            toast.error("Failed to fetch followed users");
          }
        }
      } catch {
        toast.error("Failed to fetch followed users");
      }
    };
    fetchFollowedUsers();
  }, [user?._id, dispatch]);

  const handleCreateRoom = async () => {

    if (!newRoomData.name.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (newRoomData.name.length > 50) {
      toast.error("Room name must be 50 characters or less");
      return;
    }

    if (newRoomData.description.length > 200) {
      toast.error("Description must be 200 characters or less");
      return;
    }

    // Validation for paid rooms
    if (newRoomData.isPaid) {
      if (!newRoomData.scheduledStartTime) {
        toast.error("Paid sessions must have a scheduled start time");
        return;
      }
      
      // Ensure the scheduled time is in the future
      const startTime = new Date(newRoomData.scheduledStartTime);
      if (startTime <= new Date()) {
        toast.error("Paid session start time must be in the future");
        return;
      }
    }

    try {
      // Convert invitedUsers from User[] to string[] (emails)
      const invitedEmails = newRoomData.invitedUsers
        .map(user => user.email)
        .filter((email): email is string => 
          email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );

      // For public rooms, we might not need invitedUsers or it might cause issues
      const roomDataToSend: CreateRoomData = {
        name: newRoomData.name,
        description: newRoomData.description,
        isPrivate: newRoomData.isPrivate,
        maxParticipants: newRoomData.maxParticipants,
        isPaid: newRoomData.isPaid,
        ...(newRoomData.isPaid && {
          price: newRoomData.price,
          currency: newRoomData.currency
        }),
        invitedUsers: newRoomData.isPrivate ? invitedEmails : [], // Only send invitedUsers for private rooms
        scheduledStartTime: newRoomData.scheduledStartTime // Include scheduled start time
      };

      const result = await dispatch(createRoom(roomDataToSend)).unwrap();

      toast.success("Room created successfully!");
      setShowCreateDialog(false);
      resetNewRoomData();
      
      // Refetch rooms to get complete data with createdBy information
      await dispatch(fetchRooms());
      
      // If the room is public, also refetch public sessions to show it immediately
      if (!newRoomData.isPrivate) {
        // Reset to page 1 to ensure the new room appears and pagination is correct.
        setDiscoverFilters(prev => ({ ...prev, page: 1 }));
      }
      
      // Send invitation messages if room is private and has invited users
      if (newRoomData.isPrivate && newRoomData.invitedUsers.length > 0) {
        for (const invitedUser of newRoomData.invitedUsers) {
          await sendRoomInvitationMessage(invitedUser, result);
        }
      }
    } catch (error) {
      toast.error((error as string));
    }
  };

  const joinRoomByRoomId = async (rid?: string) => {
    const idToJoin = rid ?? roomId;
    
    if (!idToJoin || !idToJoin.trim()) {
      throw new Error("Please enter a room ID");
    }
  
    try {
      // Use POST for joining public rooms
      const roomResponse = await axiosInstance.post(`/livekit/rooms/join-public/${idToJoin}`, {
        userId: user?._id  // Include user ID in the request body
      });
  
      // Accept both 200 and 201 as successful responses
      if (roomResponse.status !== 200 && roomResponse.status !== 201) {
        throw new Error("Invalid room ID or room not found");
      }
  
      const room = roomResponse.data;
      
      // Get live room status including current participant count
      try {
        const statusResponse = await axiosInstance.get(`/livekit/rooms/${idToJoin}/status`);
        if (statusResponse.status === 200) {
          const roomStatus = statusResponse.data;
          // Update the room data with live participant count
          setCurrentRoom({
            ...room,
            currentParticipants: roomStatus.participantCount || 0
          });
        } else {
          setCurrentRoom(room);
        }
      } catch {
        throw new Error('Failed to get live room status');
      }
  
      // Use the correct token endpoint for getting tokens by room ID
      const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${idToJoin}`);
  
      if (tokenResponse.status !== 200) {
        throw new Error("Failed to get token");
      }
  
      const tokenData = tokenResponse.data;
  
      if (!tokenData.token) {
        throw new Error("Invalid token response from server");
      }
  
      const { token: livekitToken } = tokenData;
  
      setToken(livekitToken);
      setJoined(true);
      setRoomId("");
      toast.success(t("joinedRoom"));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Room not found. It may have been deleted or does not exist.");
        } else if (error.response?.status === 403) {
          throw new Error(error.response.data.message || "Access denied");
        } else {
          throw new Error(t("failedToJoinRoom"));
        }
      } else {
        throw new Error(t("failedToJoinRoom"));
      }
    } finally {
      
    }
  };

  // Check localStorage for existing meeting data when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('livekitToken');
    const storedRoom = localStorage.getItem('currentRoom');
    const isJoined = localStorage.getItem('isJoined');
    
    if (storedToken && storedRoom && isJoined === 'true') {
      try {
        const roomData = JSON.parse(storedRoom);
        setToken(storedToken);
        setCurrentRoom(roomData);
        setJoined(true);
        
        // Clear localStorage after restoring state
        localStorage.removeItem('livekitToken');
        localStorage.removeItem('currentRoom');
        localStorage.removeItem('isJoined');
      } catch {
        // Clear invalid data
        localStorage.removeItem('livekitToken');
        localStorage.removeItem('currentRoom');
        localStorage.removeItem('isJoined');
      }
    }
  }, []);

  // Add a new ref for initial loading
  // const isInitialDiscoverLoadRef = useRef(true);
  const [isInitialDiscoverLoad, setIsInitialDiscoverLoad] = useState(true);

  // Modify the initial data fetching useEffect
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Only set loading to true if it hasn't been set already
        if (isMounted) {
          setIsInitialDiscoverLoad(true);
        }

        // Fetch data in parallel
        // const [
        //   roomsResult, 
        //   discoverSessionsResult, 
        //   sessionHistoryResult, 
        //   // Removed: ratedSessionsResult
        // ] = await Promise.all([
        //   dispatch(fetchRooms()),
        //   dispatch(discoverSessions({ 
        //     page: 1, 
        //     limit: 10, 
        //     sortBy: 'createdAt', 
        //     sortOrder: 'desc' 
        //   })),
        //   dispatch(fetchSessionHistory({ 
        //     page: 1, 
        //     limit: 10, 
        //     loadMore: false,
        //     sortBy: historyFilters.sortBy,
        //     sortOrder: historyFilters.sortOrder,
        //     status: historyFilters.status,
        //     type: historyFilters.type,
        //     paymentStatus: historyFilters.paymentStatus
        //   })),
        //   // Removed: ratingService.getMySubmittedRatings(1, 1000)
        // ]);

        // Reset initial loading state
        if (isMounted) {
          setIsInitialDiscoverLoad(false);
        }
      } catch {
        // Handle error and reset loading state
        if (isMounted) {
          toast.error('Failed to fetch initial data');
          setIsInitialDiscoverLoad(false);
        }
      }
    };

    // Only fetch if user is available
    if (user?._id) {
      fetchData();
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [dispatch, user?._id, historyFilters.sortBy, historyFilters.sortOrder, historyFilters.status, historyFilters.type, historyFilters.paymentStatus, historyFilters.search]);

  // Effect to refetch rooms and session history after a room is cancelled
  useEffect(() => {
    if (!cancelLoading) { // When cancellation process completes
      // Dispatch actions to refetch data to update the UI
      dispatch(fetchRooms());
      dispatch(fetchPublicSessions());
      dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
    }
  }, [cancelLoading, dispatch]);

  // Removed: Fetch ratings for ended sessions when session history changes
  // useEffect(() => {
  //   if (sessionHistory && sessionHistory.length > 0) {
  //     const endedSessions = sessionHistory.filter(session => !session.isActive);
  //     endedSessions.forEach(session => {
  //       fetchSessionRating(session.roomId);
  //     });
  //   }
  // }, [sessionHistory, fetchSessionRating]);

  // Removed: Fetch ratings for ended rooms when rooms data changes
  // useEffect(() => {
  //   if (rooms && rooms.length > 0) {
  //     const endedRooms = rooms.filter(room => !room.isActive);
  //     endedRooms.forEach(room => {
  //       fetchSessionRating(room._id);
  //     });
  //   }
  // }, [rooms, fetchSessionRating]);

  // Effect to check if user has purchased meetings (global state)
  // useEffect(() => {
  //   const checkPurchaseStatus = async () => {
  //     if (!user?._id) {
  //       return;
  //     }

  //     try {
  //       const response = await axiosInstance.get('/payment/my-purchases');
  //       if (response.data && response.data.purchases && response.data.purchases.length > 0) {
  //         setHasPurchasedMeeting(true);
  //       } else {
  //         setHasPurchasedMeeting(false);
  //       }
  //     } catch (error) {
  //       setHasPurchasedMeeting(false);
  //     }
  //   };

  //   checkPurchaseStatus();
  // }, [user?._id]);

  // Effect to check if user has purchased specific rooms (for RoomCard logic)
  // const [purchasedRoomIds, setPurchasedRoomIds] = useState<Set<string>>(new Set());

  // New useEffect to fetch purchase status for displayed rooms
  // useEffect(() => {
  //   const fetchPurchaseStatus = async () => {
  //     if (!user?._id) {
  //       setPurchasedRoomIds(new Set());
  //       return;
  //     }

  //     // Collect all unique room IDs from currently displayed sessions (discover and my-sessions)
  //     const allRoomIds = new Set<string>();
  //     discoverSessionsData.forEach(session => allRoomIds.add(session._id));
  //     rooms.forEach(room => allRoomIds.add(room._id));

  //     if (allRoomIds.size === 0) {
  //       setPurchasedRoomIds(new Set());
  //       return;
  //     }

  //     try {
  //       // setIsLoadingPurchaseStatus(true); // Start loading
  //       const response = await axiosInstance.post('/payment/check-purchase-bulk', {
  //         roomIds: Array.from(allRoomIds)
  //       });

  //       if (response.data && response.data.purchasesStatus) {
  //         const newPurchasedIds = new Set<string>();
  //         for (const roomId in response.data.purchasesStatus) {
  //           if (response.data.purchasesStatus[roomId]) {
  //             newPurchasedIds.add(roomId);
  //           }
  //         }
  //         setPurchasedRoomIds(newPurchasedIds);
  //       } else {
  //         setPurchasedRoomIds(new Set());
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch bulk purchase status:", error);
  //       toast.error(t("Failed to fetch purchase status. Please try again."));
  //       // On error, keep existing state or clear if preferred, but not set to empty on error always
  //       // setPurchasedRoomIds(new Set()); 
  //     }
  //   };

  //   fetchPurchaseStatus();
  // }, [user?._id, discoverSessionsData, rooms, t]); // Depend on user and displayed sessions

  // Helper function to check if user has purchased a specific room
  // const hasPurchasedThisRoom = useCallback((roomId: string): boolean => {
  //   console.log('purchasedRoomIds', purchasedRoomIds);
  //   console.log('roomId', roomId);
  //   return purchasedRoomIds.has(roomId);
  // }, [purchasedRoomIds]);

  // Fetch discover sessions when tab changes to discover or filters change
  useEffect(() => {
    if (activeTab === 'discover') {
      const fetchDiscoverSessions = async () => {
        const isInitialOrFilterChange = discoverFilters.page === 1;
        
        try {
          // Set loading state explicitly
          if (isInitialOrFilterChange) {
            setIsInitialDiscoverLoad(true);
          } else {
            setIsLoadingDiscoverMore(true);
          }

          const result = await dispatch(discoverSessions(discoverFilters)).unwrap();

          if (isInitialOrFilterChange) {
            // Replace data for initial load or filter changes
            setDiscoverSessionsData(result.sessions || []);
            setIsInitialDiscoverLoad(false);
          } else {
            // Append data for load more
            setDiscoverSessionsData(prev => {
              const newSessions = (result.sessions || []).filter((newSession: Room) => 
                !prev.some(existingSession => existingSession._id === newSession._id)
              );
              const updatedSessions = [...prev, ...newSessions];
              return updatedSessions;
            });
            setIsLoadingDiscoverMore(false);
          }
          
          setDiscoverSessionsPagination(result.pagination || null);
        } catch {
          // Reset loading states on error
          if (isInitialOrFilterChange) {
            setIsInitialDiscoverLoad(false);
          } else {
            setIsLoadingDiscoverMore(false);
          }
          
          // Optionally clear data on error
          setDiscoverSessionsData([]);
        } finally {
          console.groupEnd();
        }
      };
      
      fetchDiscoverSessions();
    }
  }, [dispatch, activeTab, discoverFilters]);

  // Effect to fetch session history when filters change
  useEffect(() => {
    if (activeTab === 'history' && user?._id) {
      const fetchHistoryData = async () => {
        try {
          // Always reset page to 1 when filters change
          const filtersToApply = { ...historyFilters, page: 1 };

          await dispatch(fetchSessionHistory(filtersToApply));
        } catch {
          toast.error('Failed to fetch session history');
        }
      };
      fetchHistoryData();
    }
  }, [dispatch, activeTab, user?._id, historyFilters]);

  // Modify the tab change useEffect to reset both history and discover searches
  useEffect(() => {
    // Reset search when changing tabs
    setHistoryFilters(prev => ({
      ...prev,
      search: ''
    }));
    
    // Reset discover filters search
    setDiscoverFilters(prev => ({
      ...prev,
      search: ''
    }));
  }, [activeTab]);

  const handleDisconnect = async (skipPublicSessionsRefresh = false, skipDisconnectToast = false) => {
    
    // Store currentRoom before setting it to null
    const roomToCheck = currentRoom;
    
    setJoined(false);
    setToken(null);
    setCurrentRoom(null);
    
    // Only show disconnect toast if not explicitly skipped
    if (!skipDisconnectToast) {
      toast.info(t("disconnected"));
    }

    // refresh the data
    await dispatch(fetchRooms());
    // Always refresh public sessions for participants to see updated room status

    // Comprehensive data refresh
    // 1. Refresh rooms to update room status
    await dispatch(fetchRooms());
    
    // 2. Refresh session history to update ended sessions
    await dispatch(fetchSessionHistory({ 
      page: 1, 
      limit: 10, 
      loadMore: false,
      sortBy: historyFilters.sortBy,
      sortOrder: historyFilters.sortOrder,
      status: historyFilters.status,
      type: historyFilters.type,
      paymentStatus: historyFilters.paymentStatus
    }));
    
    // 3. Force a full refresh of discover sessions
    // Ensure we get the latest state of all sessions, especially the ended one
    await dispatch(discoverSessions({ 
      page: 1, 
      limit: 10, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    }));
    
    // 4. Reset discover filters to ensure fresh data load
    setDiscoverFilters(prev => ({ 
      ...prev, 
      page: 1,
      status: 'all' // Ensure we see all session statuses
    }));

    // Only skip if explicitly requested (e.g., from handleEndSession)
    if (!skipPublicSessionsRefresh) {
      if (discoverFilters.page === 1) {
        await dispatch(discoverSessions(discoverFilters)); // Re-fetch current page to update data
      }
    }
    // await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));

    // Check if user was a participant (not creator) and show rating dialog
    if (roomToCheck && user && roomToCheck.createdBy._id && roomToCheck.createdBy._id !== user._id) {
      try {
        const { data } = await axiosInstance.get(`/livekit/rooms/${roomToCheck._id}/status`);
        const creatorName = `${roomToCheck.createdBy.firstName} ${roomToCheck.createdBy.lastName}`;
        
        setRatingSessionData({
          sessionId: roomToCheck._id,
          roomName: roomToCheck.name || 'Unknown Session',
          creatorName,
          creatorId: roomToCheck.createdBy._id,
        });

        if (data.isActive === false) {
          await dispatch(fetchRooms());
          setShowRatingDialog(true);
        }
      } catch {
        toast.error('Failed to check room status for rating dialog');
      }
    }
  };

  const handleEndSession = async () => {
    if (!currentRoom || !user) return;
    
    // Only room creator can end the session
    if (currentRoom.createdBy._id !== user._id) {
      toast.error("Only the room creator can end the session");
      return;
    }
    
    try {
      await axiosInstance.post(`/livekit/rooms/${currentRoom._id}/end-session`);
      
      // Refresh the data to update the ended sessions tab
      await dispatch(fetchRooms());
      await dispatch(fetchSessionHistory({ page: 1, limit: 10, loadMore: false }));
      
      // Always refetch public sessions because room status might have changed
      // (e.g., from Active to Ended, which affects public sessions display)
      if (discoverFilters.page === 1) {
        await dispatch(discoverSessions(discoverFilters)); // Re-fetch current page to update data
      }
      
      // Redirect all participants back to meeting page
      // Pass true to skip public sessions refresh since we already did it above
      // Also pass true to skip the disconnect toast since we already show success toast
      handleDisconnect(true, true);
      toast.success("Session ended successfully");
    } catch {
      toast.error("Failed to end session");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      // Check if there are any active participants in the room
      const statusResponse = await axiosInstance.get(`/livekit/rooms/${roomToDelete._id}/status`);
      
      if (statusResponse.status === 200) {
        const roomStatus = statusResponse.data;
        const currentParticipants = roomStatus.participantCount || 0;
        
        if (currentParticipants > 0) {
          toast.error(`Cannot delete room. There are currently ${currentParticipants} participant(s) in the room.`);
          setRoomToDelete(null);
          return;
        }
      }
      
      // Send cancellation messages to all invited users before deleting
      if (roomToDelete.isPrivate && roomToDelete.invitedUsers.length > 0) {
        for (const invitedUser of roomToDelete.invitedUsers) {
          await sendInvitationCancellationMessage(invitedUser, roomToDelete);
        }
      }
      
      // If the deleted room was public, handle local UI update for immediate feedback.
      // This local update will be overridden by the full re-fetch of page 1.
      if (!roomToDelete.isPrivate) {
        setDiscoverSessionsData(prev => prev.filter(session => session._id !== roomToDelete._id));
      }

      // Dispatch the actual delete action to the backend
      await dispatch(deleteRoom(roomToDelete._id)).unwrap();

      // After successful deletion, reset filters to page 1 to trigger a full re-fetch
      // of the first page, correctly updating the UI and pagination.
      setDiscoverFilters(prev => ({ ...prev, page: 1 }));

      toast.success(t("roomDeleted"));
    } catch (error) {
      // The error payload from Redux thunks (after .unwrap()) is usually the rejected value.
      // In our case, deleteRoom thunk rejects with a string message.
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
      
      toast.error(errorMessage);
    } finally {
      setRoomToDelete(null);
    }
  };

  const handleJoinRoom = async (room: ReduxRoom) => {
    if (room.isPrivate) {
      try {
        // New method for private rooms - direct POST request
        const roomResponse = await axiosInstance.post(`/livekit/rooms/join-private/${room._id}`, {
          userId: user?._id  // Include user ID in the request body
        });
  
        // Accept both 200 and 201 as successful responses
        if (roomResponse.status !== 200 && roomResponse.status !== 201) {
          throw new Error("Unable to join private room");
        }
  
        const joinedRoom = roomResponse.data;
        
        // Get live room status including current participant count
        try {
          const statusResponse = await axiosInstance.get(`/livekit/rooms/${room._id}/status`);
          if (statusResponse.status === 200) {
            const roomStatus = statusResponse.data;
            // Update the room data with live participant count
            setCurrentRoom({
              ...joinedRoom,
              currentParticipants: roomStatus.participantCount || 0
            });
          } else {
            setCurrentRoom(joinedRoom);
          }
        } catch {
          throw new Error('Failed to get live room status');
        }
        
        // Check if token is present in the room response
        if (joinedRoom.token) {
          // Use the token from the room response
          setToken(joinedRoom.token);
          setJoined(true);
          
          toast.success("Successfully joined the private room");
        } else {
          // If no token in room response, try getting token separately
          try {
            const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${room._id}`);
            
            if (tokenResponse.status !== 200) {
              throw new Error("Failed to get token");
            }
  
            const tokenData = tokenResponse.data;
  
            if (!tokenData.token) {
              throw new Error("Invalid token response from server");
            }
  
            // Set current room and token, proceed with joining
            setToken(tokenData.token);
            setJoined(true);
            
            toast.success("Successfully joined the private room (via separate token retrieval)");
          } catch {
            throw new Error("Failed to retrieve room token");
          }
        }
      } catch (error) {
        // More detailed error handling
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error("Room not found. It may have been deleted or does not exist.");
          } else if (error.response?.status === 403) {
            throw new Error(error.response.data.message || "Access denied");
          } else {
            throw new Error("Failed to join private room");
          }
        } else {
          throw new Error("Unexpected error joining private room");
        }
      }
    } else {
      // Public rooms use the same method
      setCurrentRoom(room);
      await joinRoomByRoomId(room._id);
    }
  };

  const handleJoinPublicSession = (session: PublicSession) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }

    setCurrentRoom(session as unknown as ReduxRoom);
    joinRoomByRoomId(session._id).finally(() => {
    });
  };

  // Handle payment and join for paid sessions
  const handlePayAndJoin = async (room: ReduxRoom) => {
    if (!room.isPaid || !room.price || !room.currency) {
      toast.error("Invalid payment information");
      return;
    }

    // Check if the room is scheduled in the future
    // const isScheduled = room.scheduledStartTime && 
    //   new Date(room.scheduledStartTime) > new Date();

    try {
      const checkoutResponse = await dispatch(createCheckoutSession({
        roomId: room._id,
        successUrl: `${window.location.origin}/meeting/${room._id}`,
        cancelUrl: `${window.location.origin}/meeting/${room._id}`
      })).unwrap();

      if (checkoutResponse.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = checkoutResponse.checkoutUrl;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to process payment");
    }
  };

  const handleEditRoom = (room: ReduxRoom) => {
    const roomForEdit = {
      ...room,
      inviteEmail: '',
      invitedUsers: room.invitedUsers || [] // Ensure invitedUsers is always an array
    };
    
    // Store original invited users for comparison
    setOriginalInvitedUsers(room.invitedUsers || []);
    setEditingRoom(roomForEdit);
    setShowEditDialog(true);
  };

  const handleDeleteRoomClick = (room: ReduxRoom) => {
    setRoomToDelete(room);
  };

  // Function to send room invitation message to a user
  const sendRoomInvitationMessage = async (invitedUser: User, room: ReduxRoom) => {
    if (!socket || !user) {
      return;
    }

    try {
      // Create a private chat room with the invited user
      socket.emit('createPrivateRoom', { receiverId: invitedUser._id }, (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the room invitation message
          const invitationMessage = {
            roomId: response.roomId,
            content: `🎥 You've been invited to join a meeting room!\n\n📋 **Room Details:**\n\n• **Name:** ${room.name}\n\n• **Description:** ${room.description}\n\n• 🔗 **Join the meeting via Link:**\n <${window.location.origin}/meeting/${room._id}/>\n\n👤 **Created by:** ${user.firstName} ${user.lastName} (@${user.username})`,
            type: 'text',
            replyTo: null,
          };
          socket.emit('chat:send_message', invitationMessage, (sendResponse: { success: boolean }) => {
            if (sendResponse && sendResponse.success) {
              toast.success('Invitation message sent successfully!'); 
            } else {
              toast.error('Failed to send invitation message');
            }
          });
        } else {
          toast.error('Failed to create private room for invitation message');
        }
      });
    } catch {
      toast.error('Failed to send room invitation message');
    }
  };

  // Function to send cancellation message for removed users
  const sendInvitationCancellationMessage = async (removedUser: User, room: ReduxRoom) => {
    if (!socket || !user) {
      return;
    }

    try {
      // Create a private chat room with the removed user
      socket.emit('createPrivateRoom', { receiverId: removedUser._id }, (response: { roomId: string }) => {
        if (response && response.roomId) {
          // Send the cancellation message
          const cancellationMessage = {
            roomId: response.roomId,
            content: `❌ **Meeting Invitation Cancelled**\n\nThe invitation to join **${room.name}** has been cancelled.\n\n👤 **Cancelled by:** ${user.username}`,
            type: 'text',
            replyTo: null,
          };

          socket.emit('chat:send_message', cancellationMessage, (sendResponse: { success: boolean }) => {
            if (sendResponse && sendResponse.success) {
              toast.success('Cancellation message sent successfully!');  
            } else {
              toast.error('Failed to send cancellation message');
            }
          });
        } else {
          toast.error('Failed to create private room for cancellation message');
        }
      });
    } catch {
      toast.error('Failed to send invitation cancellation message');
    }
  };

  const handleCancelRoomClick = (room: ReduxRoom) => {
    setRoomToCancel(room);
    setShowCancelDialog(true);
  };

  // Filter public sessions based on search query
  // const filteredPublicSessions = (publicSessions || []).filter(session =>
  //   session.name.toLowerCase().includes(sessionsSearchQuery.toLowerCase()) ||
  //   session.description.toLowerCase().includes(sessionsSearchQuery.toLowerCase()) ||
  //   (session.createdBy?.firstName?.toLowerCase() || '').includes(sessionsSearchQuery.toLowerCase()) ||
  //   (session.createdBy?.lastName?.toLowerCase() || '').includes(sessionsSearchQuery.toLowerCase())
  // );

  if (joined && token && currentRoom) {
    return (
      <VideoConferenceComponent
        token={token}
        currentRoom={currentRoom}
        onDisconnect={handleDisconnect}
        onEndSession={handleEndSession}
        currentUser={user}
      />
    );
  }

  return (
    <div>
      <Container>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-2 sm:gap-3">
              {/* <Link href="/">
                <Button variant="ghost" size="icon" className="p-2 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link> */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("title")}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
            <Link href="/ratings">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Ratings
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <TabsList className="grid w-full grid-cols-3 h-auto mb-3">
            <TabsTrigger value="discover" className="text-xs sm:text-sm py-2 sm:py-1.5">
              <Sparkles className="h-4 w-4" />
              Discover Sessions
            </TabsTrigger>
            <TabsTrigger value="my-sessions" className="text-xs sm:text-sm py-2 sm:py-1.5">
              <Video className="h-4 w-4" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2 sm:py-1.5">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Discover Sessions
                </h2>
              </div>
              
              {/* <div className="grid grid-cols-1">
                <JoinPublicSessionCard
                  roomId={roomId}
                  setRoomId={setRoomId}
                  onJoinSession={() => joinRoomByRoomId()}
                  isLoading={isJoiningPublicSession}
                  isUserInRoom={joined}
                />
              </div> */}

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2 grow-1">
                  {/* Status Filter */}
                  <div className="grow-1">
                    <Select
                      value={discoverFilters.status || 'all'}
                      onValueChange={(value) => {
                        setDiscoverFilters(prev => ({
                          ...prev,
                          status: value as 'active' | 'scheduled' | 'all',
                          page: 1 // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="grow-1">
                    <Select
                      value={discoverFilters.isPaid === undefined ? 'all' : discoverFilters.isPaid ? 'paid' : 'free'}
                      onValueChange={(value) => {
                        setDiscoverFilters(prev => ({
                          ...prev,
                          isPaid: value === 'all' ? undefined : value === 'paid' ? true : false,
                          page: 1 // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="grow-1">
                    <Select
                      value={
                        discoverFilters.sortBy === 'name' && discoverFilters.sortOrder === 'asc' ? 'name_asc' :
                        discoverFilters.sortBy === 'name' && discoverFilters.sortOrder === 'desc' ? 'name_desc' :
                        discoverFilters.sortBy === 'price' && discoverFilters.sortOrder === 'asc' ? 'price_asc' :
                        discoverFilters.sortBy === 'price' && discoverFilters.sortOrder === 'desc' ? 'price_desc' :
                        discoverFilters.sortBy === 'participants' && discoverFilters.sortOrder === 'desc' ? 'participants_desc' : // Least Participants
                        discoverFilters.sortBy === 'participants' && discoverFilters.sortOrder === 'asc' ? 'participants_asc' : // Most Participants
                        discoverFilters.sortBy === 'createdAt' && discoverFilters.sortOrder === 'asc' ? 'createdAt_asc' :
                        discoverFilters.sortBy === 'createdAt' && discoverFilters.sortOrder === 'desc' ? 'createdAt_desc' :
                        'createdAt_desc' // Default
                      }
                      onValueChange={(value) => {
                        setDiscoverFilters(prev => ({
                          ...prev,
                          sortBy: value === 'name_asc' ? 'name' :
                                  value === 'name_desc' ? 'name' :
                                  value === 'price_asc' ? 'price' :
                                  value === 'price_desc' ? 'price' :
                                  value === 'participants_asc' ? 'participants' : // Most Participants
                                  value === 'participants_desc' ? 'participants' : // Least Participants
                                  value === 'createdAt_asc' ? 'createdAt' :
                                  value === 'createdAt_desc' ? 'createdAt' :
                                  'createdAt',
                          sortOrder: value === 'name_asc' ? 'asc' :
                                      value === 'name_desc' ? 'desc' :
                                      value === 'price_asc' ? 'asc' :
                                      value === 'price_desc' ? 'desc' :
                                      value === 'participants_asc' ? 'asc' : // Most Participants
                                      value === 'participants_desc' ? 'desc' : // Least Participants
                                      value === 'createdAt_asc' ? 'asc' :
                                      value === 'createdAt_desc' ? 'asc' :
                                      'desc',
                          page: 1, // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* الترتيب الزمني */}
                        <SelectItem value="createdAt_desc">Newest First</SelectItem>
                        <SelectItem value="createdAt_asc">Oldest First</SelectItem>

                        {/* الترتيب الأبجدي */}
                        <SelectItem value="name_asc">Name A-Z</SelectItem>
                        <SelectItem value="name_desc">Name Z-A</SelectItem>

                        {/* الترتيب حسب السعر */}
                        <SelectItem value="price_asc">Lowest Price</SelectItem>
                        <SelectItem value="price_desc">Highest Price</SelectItem>

                        {/* الترتيب حسب عدد المشاركين */}
                        <SelectItem value="participants_desc">Least Participants</SelectItem>
                        <SelectItem value="participants_asc">Most Participants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* In the Discover Sessions section, update the SessionsSearch component */}
                <SessionsSearch
                  key={`discover-${activeTab}`} // Unique key to force remount
                  onSearchChange={(query) => {
                    setDiscoverFilters(prev => ({
                      ...prev,
                      search: query,
                      page: 1 // Reset to first page when search changes
                    }));
                  }}
                />
              </div>

              <div className="grid gap-3 sm:gap-4">
                {isInitialDiscoverLoad || 
                 (discoverSessionsLoading && discoverFilters.page === 1) || 
                 (discoverSessionsData.length === 0 && (isInitialDiscoverLoad || discoverSessionsLoading)) ? (
                  <>
                    {[1, 2, 3].map((_, index) => (
                      <RoomCardSkeleton key={`initial-skeleton-${index}`} />
                    ))}
                  </>
                ) : discoverSessionsData && discoverSessionsData.length > 0 ? (
                  discoverSessionsData.map((session) => {
                    // Handle both PublicSession and Room types from the API
                    const isPublicSession = 'createdBy' in session && !session.createdBy;
                    const roomData = isPublicSession ? {
                      _id: session._id,
                      name: session.name,
                      description: session.description || '',
                      isPrivate: false,
                      maxParticipants: session.maxParticipants || 10,
                      createdAt: session.createdAt,
                      createdBy: { _id: '', username: '', firstName: '', lastName: '', email: '' } as User,
                      invitedUsers: [],
                      isActive: session.isActive || false,
                      currentParticipants: session.currentParticipants || 0,
                      updatedAt: session.updatedAt || session.createdAt,
                      isPaid: session.isPaid || false,
                      price: session.price,
                      currency: session.currency
                    } : session;

                    return (
                      <RoomCard
                        key={session._id}
                        room={roomData}
                        onJoinRoom={isPublicSession ? () => handleJoinPublicSession(session as PublicSession) : handleJoinRoom}
                        onPayAndJoin={handlePayAndJoin}
                        onEditRoom={undefined} // No edit for discover sessions
                        onDeleteRoom={undefined} // No delete for discover sessions
                        currentUser={user || undefined}
                        isUserInRoom={joined}
                        showActions={true}
                        showRating={false}
                        showEditDelete={false}
                        isUserInvited={roomData.invitedUsers.some((invitedUser: User) => invitedUser._id === user?._id)}
                      />
                    );
                  })
                ) : (
                  <Card className="dark:border-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                      <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                      <p className="text-sm text-base text-muted-foreground text-center">
                        No sessions available
                      </p>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Sessions will appear here when available.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Skeleton loading for Load More */}
                {/* {isLoadingDiscoverMore && (
                  <>
                    <RoomCardSkeleton />
                  </>
                )} */}
              </div>

              {/* Load More Button for Discover Sessions */}
              {discoverSessionsPagination?.hasNext && (
                <div className="flex flex-col items-center gap-3 pt-4">
                  <Button
                    onClick={() => setDiscoverFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={discoverSessionsLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isLoadingDiscoverMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Sessions
                        <span className="text-xs text-muted-foreground">
                          ({discoverSessionsData.length} of {discoverSessionsPagination.total})
                        </span>
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    Page {discoverSessionsPagination.page} • {discoverSessionsPagination.totalPages} total pages
                  </div>
                </div>
              )}
            </div>
          </TabsContent>


          <TabsContent value="my-sessions" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold">My Sessions</h2>
              <Button onClick={() => { resetNewRoomData(); setShowCreateDialog(true); }} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </div>

            <div className="space-y-6">
              {/* Open Sessions */}
              <div className="space-y-3">
                <div className="grid gap-3 sm:gap-4">
                  {rooms.filter(room => room.isActive).length === 0 ? (
                    <Card className="flex items-center dark:border-transparent">
                      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center">
                          No sessions
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    // Sort open rooms by creation date (newest first)
                    [...rooms]
                      .filter(room => room.isActive && !room.cancelledAt) // Filter out cancelled rooms
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((room) => (
                        <RoomCard
                          key={room._id}
                          room={room}
                          onJoinRoom={handleJoinRoom}
                          onPayAndJoin={handlePayAndJoin}
                          onEditRoom={handleEditRoom}
                          onDeleteRoom={handleDeleteRoomClick}
                          currentUser={user || undefined}
                          isUserInRoom={joined}
                          isUserInvited={true} // For 'My Sessions', user is always invited (or creator)
                          onCancelRoom={handleCancelRoomClick} // Pass the handler to RoomCard
                        />
                      ))
                  )}
                </div>
              </div>


            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Session History
                </h2>
              </div>

              {/* Filter Controls for History */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2 grow-1">
                  {/* Status Filter */}
                  <div className="grow-1">
                    <Select
                      value={historyFilters.status || 'all'}
                      onValueChange={(value) => {
                        setHistoryFilters(prev => ({
                          ...prev,
                          status: value as 'active' | 'scheduled' | 'ended' | 'all' | undefined,
                          page: 1 // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="grow-1">
                    <Select
                      value={historyFilters.type || 'all'}
                      onValueChange={(value) => {
                        setHistoryFilters(prev => ({
                          ...prev,
                          type: value as 'public' | 'private' | 'all' | undefined,
                          page: 1 // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Status Filter */}
                  <div className="grow-1">
                    <Select
                      value={historyFilters.paymentStatus || 'all'}
                      onValueChange={(value) => {
                        setHistoryFilters(prev => ({
                          ...prev,
                          paymentStatus: value as 'paid' | 'free' | 'all' | undefined,
                          page: 1 // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Payment Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  {/* <div className="grow-1">
                    <Select
                      value={
                        historyFilters.sortBy === 'name' && historyFilters.sortOrder === 'asc' ? 'name_asc' :
                        historyFilters.sortBy === 'name' && historyFilters.sortOrder === 'desc' ? 'name_desc' :
                        historyFilters.sortBy === 'lastJoined' && historyFilters.sortOrder === 'asc' ? 'lastJoined_asc' :
                        historyFilters.sortBy === 'lastJoined' && historyFilters.sortOrder === 'desc' ? 'lastJoined_desc' :
                        'lastJoined_desc' // Default
                      }
                      onValueChange={(value) => {
                        setHistoryFilters(prev => ({
                          ...prev,
                          sortBy: value === 'name_asc' ? 'name' :
                                  value === 'name_desc' ? 'name' :
                                  value === 'lastJoined_asc' ? 'lastJoined' :
                                  value === 'lastJoined_desc' ? 'lastJoined' :
                                  'lastJoined',
                          sortOrder: value === 'name_asc' ? 'asc' :
                                      value === 'name_desc' ? 'desc' :
                                      value === 'lastJoined_asc' ? 'asc' :
                                      value === 'lastJoined_desc' ? 'desc' :
                                      'desc',
                          page: 1, // Reset to first page when filter changes
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lastJoined_desc">Most Recent</SelectItem>
                        <SelectItem value="lastJoined_asc">Oldest First</SelectItem>
                        <SelectItem value="name_asc">Name A-Z</SelectItem>
                        <SelectItem value="name_desc">Name Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>

                <SessionsSearch
                  key={activeTab} // This will force a complete remount when tab changes
                  onSearchChange={(query) => {
                    setHistoryFilters(prev => ({
                      ...prev,
                      search: query,
                      page: 1 // Reset to first page when search changes
                    }));
                  }}
                  resetSearch={false} // Pass false to prevent default reset
                />
              </div>
              
              {/* Debugging Logs */}
              {/* console.log("History Tab - sessionHistory:", sessionHistory) */}
              {/* console.log("History Tab - historyPagination:", historyPagination) */}
              {/* console.log("History Tab - historyFiltersData:", historyFiltersData) */}

              {/* Session Statistics */}
              {!sessionHistoryLoading && historyFiltersData ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">{historyFiltersData.totalActiveSessions + historyFiltersData.totalEndedSessions + historyFiltersData.totalCancelledSessions}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Total Sessions</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{historyFiltersData.totalActiveSessions}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Open Sessions</div>
                    </CardContent>
                  </Card>
                  <Card className="dark:border-transparent">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{historyFiltersData.totalEndedSessions}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Ended Sessions</div>
                    </CardContent>
                  </Card>
                   <Card className="dark:border-transparent">
                     <CardContent className="p-3 sm:p-4 text-center">
                       <div className="text-2xl sm:text-3xl font-bold text-orange-600">{historyFiltersData.totalCancelledSessions}</div>
                       <div className="text-xs sm:text-sm text-muted-foreground">Cancelled Sessions</div>
                     </CardContent>
                   </Card>
                </div>
              ) : null}
              
              {sessionHistoryLoading ? (
                <div className="grid gap-3 sm:gap-4">
                    {[1, 2, 3].map((_, index) => (
                      <RoomCardSkeleton key={`history-skeleton-${index}`} />
                    ))}
                  </div>
              ) : (() => {
                // If no session history exists and it's the first load
                if ((!sessionHistory || sessionHistory.length === 0) && 
                    historyFilters.page === 1 && 
                    !historyFilters.search) {
                  return (
                    <Card className="dark:border-transparent">
                      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm text-muted-foreground text-center">
                          You haven&apos;t participated in any sessions yet
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                // Filter sessions based on search
                const filteredSessions = sessionHistory.filter(session => 
                  historyFilters.search ? (
                    session.roomName.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
                    session.roomDescription.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
                    session.createdBy?.firstName?.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
                    session.createdBy?.lastName?.toLowerCase().includes(historyFilters.search.toLowerCase())
                  ) : true
                );

                // If no sessions match the search
                if (filteredSessions.length === 0) {
                  return (
                    <Card className="dark:border-transparent">
                      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm text-muted-foreground text-center">
                          No sessions match your search
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                // Render filtered sessions
                return (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4">
                      {filteredSessions.map((session) => {
                        const room: Room = {
                          _id: session.roomId,
                          name: session.roomName,
                          description: session.roomDescription || '', 
                          isPrivate: session.isPrivate || false,
                          maxParticipants: session.maxParticipants || 10,
                          createdAt: session.createdAt,
                          createdBy: session.createdBy || { _id: '', username: '', firstName: '', lastName: '', email: '' } as User,
                          invitedUsers: session.invitedUsers || [],
                          isActive: session.isActive || false,
                          currentParticipants: session.currentParticipants || 0,
                          totalParticipantsJoined: session.totalParticipantsJoined || 0,
                          endedDate: session.endedAt,
                          scheduledStartTime: session.scheduledStartTime,
                          isPaid: session.isPaid || false,
                          price: session.price,
                          currency: session.currency,
                          cancelledAt: session.cancelledAt,
                          cancellationReason: session.cancellationReason,
                          secretId: session.secretId || '', 
                          updatedAt: session.updatedAt || session.createdAt, 
                          averageRating: session.averageRating, 
                          ratingCount: session.ratingCount,     
                          userRating: session.userRating,       
                          isUserRated: session.isUserRated,     
                        };

                        return (
                          <RoomCard
                            key={room._id}
                            room={room}
                            onJoinRoom={() => { /* No join action needed in history */ }}
                            onPayAndJoin={() => { /* No pay & join action needed in history */ }}
                            onEditRoom={undefined}
                            onDeleteRoom={undefined}
                            onCancelRoom={undefined}
                            currentUser={user || undefined}
                            isUserInRoom={false}
                            showActions={true}
                            showParticipants={false}
                            showJoinButton={false}
                            showRating={true}
                            onRateSession={() => handleRateSession(session)}
                            showEditDelete={false}
                            isUserInvited={true}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Load More Button */}
                    {historyPagination?.hasNext && 
                     filteredSessions.length > 0 && 
                     historyPagination.totalPages > 1 && 
                     (historyPagination.total > (historyFilters.limit || 10)) && (
                      <div className="flex flex-col items-center gap-3 pt-4">
                        <Button
                          onClick={handleLoadMoreSessions}
                          disabled={isLoadingMore}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More Sessions
                              <span className="text-xs text-muted-foreground">
                                ({filteredSessions.length} of {historyPagination.total})
                              </span>
                            </>
                          )}
                        </Button>
                        
                        {/* Pagination Info */}
                        <div className="text-xs text-muted-foreground text-center">
                          Page {historyPagination.page} • {historyPagination.totalPages} total pages
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          
        </Tabs>

        {/* Create Room Dialog */}
        <RoomDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              resetNewRoomData(); // Reset form data when dialog is closed
            }
          }}
          mode="create"
          roomData={newRoomData as unknown as Room}
          onRoomDataChange={(data: Room) => setNewRoomData(data as unknown as {
              name: string;
              description: string;
              isPrivate: boolean;
              maxParticipants: number;
              isPaid: boolean;
              price: number | undefined;
              currency: string;
              invitedUsers: User[];
              inviteEmail: string;
              scheduledStartTime: string | undefined;
            })}
          onSubmit={handleCreateRoom}
          isLoading={createLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          currentUser={user || undefined}
        />

        {/* Edit Room Dialog */}
        <RoomDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setEditingRoom(null); // Clear editing room when dialog is closed
            }
          }}
          mode="edit"
          roomData={editingRoom || ({} as Room)}
          onRoomDataChange={(data: Room) => {
              setEditingRoom(data as ReduxRoom);
            }}
          onSubmit={async () => {
            if (editingRoom) {
              // Convert invitedUsers from User[] to string[] (emails)
              const invitedEmails = editingRoom.invitedUsers
                .map(user => user.email)
                .filter((email): email is string => 
                  email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                );

              // Ensure scheduledStartTime is properly formatted for the backend
              // If it's undefined, send null to explicitly clear it
              const scheduledStartTime = editingRoom.scheduledStartTime === undefined ? null : editingRoom.scheduledStartTime;
              
              const roomDataToSend: UpdateRoomData = {
                name: editingRoom.name,
                description: editingRoom.description,
                isPrivate: editingRoom.isPrivate,
                maxParticipants: editingRoom.maxParticipants,
                isPaid: editingRoom.isPaid,
                ...(editingRoom.isPaid && {
                  price: editingRoom.price,
                  currency: editingRoom.currency
                }),
                invitedUsers: invitedEmails,
                scheduledStartTime: scheduledStartTime
              };

              try {
                const updatedRoom = await dispatch(updateRoom({ roomId: editingRoom._id, roomData: roomDataToSend })).unwrap();
                
                // Manually update the local state to ensure scheduledStartTime is correctly updated
                // This is necessary because the backend might not send undefined values properly
                const manuallyUpdatedRoom = {
                  ...updatedRoom,
                  scheduledStartTime: editingRoom.scheduledStartTime
                };
                
                // Update the Redux store manually to ensure our changes are reflected
                dispatch({
                  type: 'meeting/updateRoom/fulfilled',
                  payload: manuallyUpdatedRoom
                });
                
                // Update discoverSessionsData locally
                setDiscoverSessionsData(prev => prev.map(session => 
                  session._id === updatedRoom._id ? { ...session, ...updatedRoom } : session
                ));
                
                // Removed conditional re-fetch for edits as per user instruction.
                
                // Compare original vs new invited users and send appropriate messages
                if (editingRoom.isPrivate) {
                  const originalEmails = originalInvitedUsers.map(user => user.email).filter(Boolean);
                  const newEmails = invitedEmails;
                  
                  // Find removed users (in original but not in new)
                  const removedUsers = originalInvitedUsers.filter(user => 
                    user.email && !newEmails.includes(user.email)
                  );
                  
                  // Find added users (in new but not in original)
                  const addedUsers = editingRoom.invitedUsers.filter(user => 
                    user.email && !originalEmails.includes(user.email)
                  );
                  
                  // Send cancellation messages to removed users
                  for (const removedUser of removedUsers) {
                    await sendInvitationCancellationMessage(removedUser, editingRoom);
                  }
                  
                  // Send invitation messages to newly added users
                  for (const addedUser of addedUsers) {
                    await sendRoomInvitationMessage(addedUser, updatedRoom);
                  }
                }
                
                // Refresh rooms data to ensure everything is up to date
                await dispatch(fetchRooms());
                
                setShowEditDialog(false);
                setEditingRoom(null);
                setOriginalInvitedUsers([]);
              } catch (error: unknown) {
                toast.error(error as string);
              }
            }
          }}
          isLoading={updateLoading}
          followedUsers={followedUsers}
          showSuggestionMenu={showSuggestionMenu}
          setShowSuggestionMenu={setShowSuggestionMenu}
          currentUser={user || undefined}
        />

        {/* Confirm Delete Dialog */}
        <DeleteConfirmDialog
          open={!!roomToDelete}
          onOpenChange={(open) => {
            if (!open) setRoomToDelete(null);
          }}
          onConfirm={handleDeleteRoom}
        />

        {/* Cancel Room Dialog */}
        {roomToCancel && (
          <CancelRoomModal
            isOpen={showCancelDialog}
            onClose={() => {
              setShowCancelDialog(false);
              setRoomToCancel(null);
            }}
            roomId={roomToCancel._id}
            roomName={roomToCancel.name}
          />
        )}

        {/* Session Rating Dialog */}
        {ratingSessionData && (
          <SessionRatingDialog
            open={showRatingDialog}
            onOpenChange={(open) => {
              if (!open) {
                setShowRatingDialog(false);
                setRatingSessionData(null);
              } else {
                setShowRatingDialog(true);
              }
            }}
            sessionId={ratingSessionData.sessionId}
            roomName={ratingSessionData.roomName}
            creatorName={ratingSessionData.creatorName}
            creatorId={ratingSessionData.creatorId}
            onRatingSubmitted={async () => {
              setShowRatingDialog(false);
              if (ratingSessionData && user?._id) {
                // Instead, refetch session history to get updated ratings
                await dispatch(fetchSessionHistory({ 
                  page: historyFilters.page,
                  limit: historyFilters.limit,
                  sortBy: historyFilters.sortBy,
                  sortOrder: historyFilters.sortOrder,
                  status: historyFilters.status,
                  type: historyFilters.type,
                  paymentStatus: historyFilters.paymentStatus,
                  search: historyFilters.search
                }));
              }
              setRatingSessionData(null);
            }}
          />
        )}

        {/* {error && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg">
            {error}
          </div>
        )} */}
      </Container>
    </div>
  );
}; 