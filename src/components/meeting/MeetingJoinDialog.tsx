"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Video, Loader2, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { Room, PublicSession } from "@/store/slices/meetingSlice";
import axiosInstance from "@/lib/axios";
import { User } from "@/types/user";
import { AxiosError } from "axios";

interface MeetingJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Room | PublicSession;
  currentUser?: User; // Add current user to check if they're invited or creator
}

export const MeetingJoinDialog = ({ 
  open, 
  onOpenChange, 
  meeting,
  currentUser 
}: MeetingJoinDialogProps) => {
  const router = useRouter();
  const [secretId, setSecretId] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Check if user is creator or invited user
  const isCreator = meeting && 'createdBy' in meeting && meeting.createdBy?._id === currentUser?._id;
  const isInvited = meeting && 'invitedUsers' in meeting && 
    meeting.invitedUsers?.some((user: User) => user._id === currentUser?._id);

  const handleJoinMeeting = async () => {
    if (!meeting) return;

    try {
      setLoading(true);
      

      
      if (meeting.isPrivate === true) {
        // For private rooms, check if user is creator or invited
        if (isCreator || isInvited) {
          // User is authorized - no need for secret ID
          const roomResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}`);
          if (roomResponse.data) {
            // Get token directly for authorized users
            const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${meeting._id}`);
            if (tokenResponse.data?.token) {
              localStorage.setItem('livekitToken', tokenResponse.data.token);
              localStorage.setItem('currentRoom', JSON.stringify(roomResponse.data));
              localStorage.setItem('isJoined', 'true');
              
              onOpenChange(false);
              router.push('/meeting');
              toast.success("Successfully joined the meeting!");
            } else {
              toast.error("Failed to get access token");
            }
          }
        } else {
          // User is not authorized - need secret ID
          if (!secretId.trim()) {
            toast.error("Please enter the secret ID to join this private meeting");
            return;
          }
          
          const roomResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}`);
          if (roomResponse.data) {
            // Validate secret ID
            const secretIdResponse = await axiosInstance.get(`/livekit/rooms/${meeting._id}/secret-id`);
            if (secretIdResponse.data?.secretId !== secretId) {
              toast.error("Invalid secret ID for this meeting");
              return;
            }
            
            // Get token using secret ID
            const tokenResponse = await axiosInstance.get(`/livekit/token?secretId=${secretId}`);
            if (tokenResponse.data?.token) {
              localStorage.setItem('livekitToken', tokenResponse.data.token);
              localStorage.setItem('currentRoom', JSON.stringify(roomResponse.data));
              localStorage.setItem('isJoined', 'true');
              
              onOpenChange(false);
              router.push('/meeting');
              toast.success("Successfully joined the meeting!");
            } else {
              toast.error("Failed to get access token");
            }
          }
        }
      } else {
        // Public session - no secret ID needed
        const roomResponse = await axiosInstance.get(`/livekit/rooms/join-public/${meeting._id}`);
        if (roomResponse.data) {
          const tokenResponse = await axiosInstance.get(`/livekit/token/room?roomId=${meeting._id}`);
          if (tokenResponse.data?.token) {
            localStorage.setItem('livekitToken', tokenResponse.data.token);
            localStorage.setItem('currentRoom', JSON.stringify(roomResponse.data));
            localStorage.setItem('isJoined', 'true');
            
            onOpenChange(false);
            router.push('/meeting');
            toast.success("Successfully joined the public session!");
          } else {
            toast.error("Failed to get access token for public session");
          }
        }
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error((error as AxiosError<{ message: string }>)?.response?.data?.message || "Failed to join meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Join Meeting
          </DialogTitle>
          <DialogDescription>
            {meeting.isPrivate === true
              ? "Enter the secret ID to join this private meeting"
              : "Click join to enter this public session"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-name">Meeting Name</Label>
            <div className="text-sm font-medium text-muted-foreground">
              {meeting.name}
            </div>
          </div>
          
          {/* Secret ID Input - Only for Private Meetings when user is not authorized */}
          {meeting.isPrivate === true && !isCreator && !isInvited && (
            <div className="space-y-2">
              <Label htmlFor="secret-id">Secret ID *</Label>
              <Input
                id="secret-id"
                type="text"
                placeholder="Enter the secret ID"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                You need the secret ID to join this private meeting
              </p>
            </div>
          )}
          
          {/* Public Session Info - Only for Public Meetings */}
          {meeting.isPrivate === false && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This is a public session. No secret ID required.
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {meeting.isPrivate === true ? (
              <>
                <Lock className="h-4 w-4" />
                Private Meeting
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Public Session
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinMeeting}
            disabled={loading || (meeting.isPrivate === true && !isCreator && !isInvited && !secretId.trim())}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Join Meeting
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
