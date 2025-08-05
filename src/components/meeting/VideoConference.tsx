"use client";

import { Room } from "@/store/slices/meetingSlice";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Video } from "lucide-react";
import Link from "next/link";

interface VideoConferenceProps {
  token: string;
  currentRoom: Room;
  onDisconnect: () => void;
}

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://codeconnect-1r7agrz5.livekit.cloud";

export const VideoConferenceComponent = ({ token, currentRoom, onDisconnect }: VideoConferenceProps) => {
  return (
    <div className="min-h-screen bg-background">
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
        <div className="">
          <div className="text-muted-foreground">
            Created by
            <Link
              href={`/profile/${currentRoom.createdBy.username}`}
              className="text-primary hover:underline ms-1"
            >
              {currentRoom.createdBy.username}
            </Link>
          </div>
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