"use client";

import { Room } from "@/store/slices/meetingSlice";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Video, PowerOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VideoConferenceProps {
  token: string;
  currentRoom: Room;
  onDisconnect: () => void;
  onEndSession: () => Promise<void>;
  currentUser: User | null;
}

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://codeconnect-1r7agrz5.livekit.cloud";

export const VideoConferenceComponent = ({ 
  token, 
  currentRoom, 
  onDisconnect, 
  onEndSession, 
  currentUser 
}: VideoConferenceProps) => {
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false);

  const handleConfirmEndSession = async () => {
    await onEndSession();
    setIsEndSessionDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background fixed w-full top-0 left-0 z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">{currentRoom.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentRoom.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            Created by
            <Link
              href={`/profile/${currentRoom?.createdBy?.username}`}
              className="text-primary hover:underline ms-1"
            >
              {currentRoom?.createdBy?.username}
            </Link>
          </div>
          
          {/* End Session Button - Only for room creator */}
          {currentUser && currentRoom?.createdBy?._id === currentUser._id && (
            <AlertDialog open={isEndSessionDialogOpen} onOpenChange={setIsEndSessionDialogOpen}> 
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsEndSessionDialogOpen(true)}
                >
                  <PowerOff className="h-4 w-4" />
                  End Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to end this session? All participants will be disconnected and may be prompted to rate the session.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmEndSession} className="bg-danger hover:bg-danger/90 cursor-pointer">
                    End Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-80px)]">
        <LiveKitRoom
          token={token}
          data-lk-theme="default"
          serverUrl={LIVEKIT_URL}
          connect={true}
          onDisconnected={onDisconnect}
          style={{ height: "100%", width: "100%" }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  );
}; 