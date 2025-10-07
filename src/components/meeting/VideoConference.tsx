"use client";

import { Room } from "@/store/slices/meetingSlice";
import { 
  LiveKitRoom, 
  VideoConference
} from "@livekit/components-react";
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

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

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

  // High-quality settings for screen sharing
  const roomOptions = {
    // Disable automatic optimization to maintain consistent quality
    adaptiveStream: false,
    dynacast: true,
    stopLocalTrackOnUnpublish: false,
    
    // Regular camera settings
    videoCaptureDefaults: {
      frameRate: 60,
      resolution: {
        width: 1920,
        height: 1080,
        frameRate: 60
      }
    },
    
    // Default publishing settings
    publishDefaults: {
      // Regular video settings
      videoEncoding: {
        maxBitrate: 4_000_000, // 4 Mbps for camera
        maxFramerate: 60,
        priority: 'high' as const,
        degradationPreference: 'maintain-resolution' as const
      },
      
      // Special settings for screen share
      screenShareEncoding: {
        maxBitrate: 8_000_000, // 8 Mbps for screen - excellent quality
        maxFramerate: 60,
        priority: 'high' as const,
        degradationPreference: 'maintain-resolution' as const // Always maintain resolution
      },
      
      // Audio settings
      audioEncoding: {
        maxBitrate: 128_000, // 128 kbps for high-quality audio
        priority: 'high' as const
      },
      
      // Disable features that might affect quality
      simulcast: false, // Disable automatic scaling
      backupCodec: false
    },
    
    // Enhanced connection settings for high quality
    rtcConfig: {
      iceTransportPolicy: 'all' as const,
      bundlePolicy: 'balanced' as const,
      iceCandidatePoolSize: 10,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    },
    
    // Additional stability settings
    reconnectPolicy: {
      nextRetryDelayInMs: (context: { retryCount: number }): number => {
        return Math.min(context.retryCount * 2000, 10000);
      },
      maxRetryCount: 10
    },
    
    // Network optimization
    expWebRTCSimulcast: false, // Disable simulcast for consistent quality
    
    // Special settings for screen sharing
    screenShareCaptureDefaults: {
      // Maximum screen resolution
      resolution: {
        width: 1920,
        height: 1080,
        frameRate: 60
      },
      
      // Advanced clarity options
      video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
        displaySurface: 'monitor' as const,
        logicalSurface: true,
        cursor: 'always' as const
      },
      
      // System audio recording
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 2
      },
      
      // Quality preferences
      preferCurrentTab: false,
      selfBrowserSurface: 'exclude' as const,
      systemAudio: 'include' as const
    }
  };

  return (
    <div className="min-h-screen bg-background fixed w-full top-0 left-0 z-50">
      <div className="flex items-center justify-between p-4 border-b border-dark-border text-dark-foreground h-[80px] bg-dark ">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Video className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="overflow-hidden">
            <h1 className="text-xl font-semibold mb-1 truncate">{currentRoom.name}</h1>
            <div className="text-muted-foreground truncate text-sm">
              by
              <Link
                href={`/profile/${currentRoom?.createdBy?.username}`}
                className="text-primary hover:underline ms-1"
              >
                {currentRoom?.createdBy?.firstName} {currentRoom?.createdBy?.lastName}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* End Session Button - Only for room creator */}
          {currentUser && currentRoom?.createdBy?._id === currentUser._id && (
            <AlertDialog open={isEndSessionDialogOpen} onOpenChange={setIsEndSessionDialogOpen}> 
              <AlertDialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 bg-danger hover:bg-danger/90 cursor-pointer"
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
          options={roomOptions}
          onDisconnected={() => {
            onDisconnect();
          }}
          style={{ height: "100%", width: "100%" }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  );
};