"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { RefreshCw, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { User } from "@/types/user";
import { Room } from "@/store/slices/meetingSlice";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { fetchUserByEmail } from "@/store/slices/userSlice";
import { AppDispatch } from "@/store/store";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  roomData: Room;
  onRoomDataChange: (data: Room) => void;
  onSubmit: () => void;
  isLoading: boolean;
  followedUsers: User[];
  showSuggestionMenu: boolean;
  setShowSuggestionMenu: (show: boolean) => void;
  currentUser?: User;
}

export const RoomDialog = ({
  open,
  onOpenChange,
  mode,
  roomData,
  onRoomDataChange,
  onSubmit,
  isLoading,
  followedUsers,
  showSuggestionMenu,
  setShowSuggestionMenu,
  currentUser
}: RoomDialogProps) => {
  const t = useTranslations("meeting");
  const dispatch = useDispatch<AppDispatch>();
   
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const suggestionMenu = document.querySelector('.suggestion-menu');
      const inputElement = document.querySelector(`input[name="${mode}-invite-input"]`);
      
      if (
        suggestionMenu && 
        !suggestionMenu.contains(event.target as Node) && 
        !inputElement?.contains(event.target as Node)
      ) {
        setShowSuggestionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mode, setShowSuggestionMenu]);

  const handleAddEmail = async () => {
    const email = roomData.inviteEmail?.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // get User by Email
      const user = await dispatch(fetchUserByEmail(email)).unwrap() as User;
      const userToAdd = user;
      
      // Add user to invited users if not already added
      onRoomDataChange({
        ...roomData,
        invitedUsers: roomData.invitedUsers?.some((u: User) => u.email === email)
          ? roomData.invitedUsers
          : [...(roomData.invitedUsers || []), userToAdd],
        inviteEmail: '' // Clear input after adding
      });
    } else {
      toast.error("Please enter a valid email address");
    }
  };

   const handleSuggestionClick = (user: User) => {
    if (user.email) {
      onRoomDataChange({
        ...roomData,
        invitedUsers: roomData.invitedUsers?.some((u: User) => u._id === user._id)
          ? roomData.invitedUsers
          : [...(roomData.invitedUsers || []), user],
        inviteEmail: '' // Clear input
      });
      setShowSuggestionMenu(false);
    }
  };

  const handleRemoveUser = (index: number) => {
    const updatedInvitedUsers = roomData.invitedUsers?.filter((_: User, i: number) => i !== index);
    
    onRoomDataChange({
      ...roomData,
      invitedUsers: updatedInvitedUsers
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'create' ? t('createNewRoomTitle') : 'Edit Room'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create' ? t('createNewRoomDesc') : 'Update room settings and details'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:gap-4 py-3 sm:py-4 overflow-y-auto px-6 -mx-6">
          <div className="grid gap-2">
            <label htmlFor={`${mode}-name`} className="text-sm font-medium">
              {mode === 'create' ? t('roomName') : 'Room Name'}
            </label>
            <Input
              id={`${mode}-name`}
              value={roomData.name || ''}
              onChange={(e) => onRoomDataChange({ ...roomData, name: e.target.value })}
              placeholder={mode === 'create' ? t('enterRoomName') : 'Enter room name'}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${mode}-description`} className="text-sm font-medium">
              {mode === 'create' ? t('description') : 'Description'}
            </label>
            <Input
              id={`${mode}-description`}
              value={roomData.description || ''}
              onChange={(e) => onRoomDataChange({ ...roomData, description: e.target.value })}
              placeholder={mode === 'create' ? t('enterDescription') : 'Enter room description'}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${mode}-scheduledStartTime`} className="text-sm font-medium">
              Scheduled Start Time
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {roomData.scheduledStartTime ? (
                    <span>
                      {new Date(roomData.scheduledStartTime).toLocaleDateString()} at{' '}
                      {new Date(roomData.scheduledStartTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  ) : (
                    <span>Pick meeting start date and time (optional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={roomData.scheduledStartTime ? new Date(roomData.scheduledStartTime) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      // Preserve existing time if available, otherwise set to current time
                      const existingTime = roomData.scheduledStartTime ? new Date(roomData.scheduledStartTime) : new Date();
                      const newDateTime = new Date(date);
                      newDateTime.setHours(existingTime.getHours(), existingTime.getMinutes(), 0, 0);
                      
                      onRoomDataChange({ 
                        ...roomData, 
                        scheduledStartTime: newDateTime.toISOString()
                      });
                    } else {
                      onRoomDataChange({ 
                        ...roomData, 
                        scheduledStartTime: undefined
                      });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Time input for scheduled start time */}
            {roomData.scheduledStartTime && (
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={new Date(roomData.scheduledStartTime!).toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const currentDate = new Date(roomData.scheduledStartTime!);
                    currentDate.setHours(hours || 0, minutes || 0, 0, 0);
                    
                    onRoomDataChange({ 
                      ...roomData, 
                      scheduledStartTime: currentDate.toISOString()
                    });
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    onRoomDataChange({ 
                      ...roomData, 
                      scheduledStartTime: undefined
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Set when you&apos;d like the meeting to start. Participants can&apos;t join earlier.
            </p>
          </div>
          <div className="grid gap-2 hidden">
            <label htmlFor={`${mode}-maxParticipants`} className="text-sm font-medium">
              {mode === 'create' ? t('maxParticipantsLabel') : 'Max Participants'}
            </label>
            <Input
              id={`${mode}-maxParticipants`}
              type="number"
              value={roomData.maxParticipants || 10}
              onChange={(e) => onRoomDataChange({ ...roomData, maxParticipants: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${mode}-isPrivate`}
              checked={roomData.isPrivate || false}
              onCheckedChange={(checked: boolean) => onRoomDataChange({ ...roomData, isPrivate: checked })}
            />
            <label htmlFor={`${mode}-isPrivate`} className="text-sm font-medium">
              {mode === 'create' ? t('privateRoom') : 'Private Room'}
            </label>
          </div>
          {roomData.isPrivate && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Invite Users</label>
              <div className="flex gap-2">
                <Input 
                  type="email"
                  name={`${mode}-invite-input`}
                  placeholder="Enter email" 
                  value={roomData.inviteEmail || ''}
                  onChange={(e) => {
                    onRoomDataChange({ ...roomData, inviteEmail: e.target.value });
                    setShowSuggestionMenu(true);
                  }}
                  onFocus={() => setShowSuggestionMenu(true)}
                  className="flex-grow text-sm sm:text-base"
                />
                <Button 
                  variant="secondary"
                  onClick={handleAddEmail}
                  className="text-xs sm:text-sm"
                >
                  Add
                </Button>
              </div>

              {/* Suggestion Menu */}
              {showSuggestionMenu && followedUsers.filter(user => 
                user.email && 
                !roomData.invitedUsers?.some((u: User) => u._id === user._id)
              ).length > 0 && (
                <div className="suggestion-menu relative z-50 bg-background border rounded-md max-h-48 overflow-y-auto">
                  <div className="max-h-40 overflow-y-auto">
                    {followedUsers
                      .filter(user => 
                        user.email && // Only users with emails
                        !roomData.invitedUsers?.some((u: User) => u._id === user._id)
                      )
                      .map((user: User) => (
                        <div 
                          key={user._id}
                          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer border-b border-border/20 last:border-b-0"
                          onClick={() => handleSuggestionClick(user)}
                        >
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={user.avatar || ''} alt={user.username || ''} />
                            <AvatarFallback>
                              {user.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{user.username}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Invited Users Display */}
              {roomData.invitedUsers && roomData.invitedUsers.length > 0 ? (
                <div className="border rounded-md p-2 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {roomData.invitedUsers
                      .filter((user: User) => user._id !== currentUser?._id && user._id) // Hide current user by ID and filter out users without ID
                      .map((user: User, index: number) => {
                        // Find the actual index in the original array (before filtering)
                        const originalIndex = roomData.invitedUsers.findIndex((u: User) => u._id === user._id);
                        if (originalIndex === -1) {
                          return null;
                        }
                        return (
                          <Badge 
                            key={user._id || user.email || index} 
                            variant="secondary" 
                            className="flex items-center text-xs"
                          >
                            <span className="truncate max-w-[120px] sm:max-w-[150px]">
                              {user.email || user.username || `User ${user._id || 'unknown'}`}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-1 h-3 w-3 sm:h-4 sm:w-4"
                              onClick={() => handleRemoveUser(originalIndex)}
                            >
                              <X className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-sm">
            {mode === 'create' ? t('cancel') : 'Cancel'}
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isLoading || !roomData.name?.trim()}
            className="w-full sm:w-auto text-sm"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : mode === 'create' ? (
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : null}
            <span>{mode === 'create' ? t('createRoom') : 'Update Room'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 