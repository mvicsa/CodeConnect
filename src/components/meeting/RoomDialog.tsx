"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { RefreshCw, Plus, X } from "lucide-react";
import { User } from "@/types/user";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  roomData: any;
  onRoomDataChange: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  followedUsers: User[];
  showSuggestionMenu: boolean;
  setShowSuggestionMenu: (show: boolean) => void;
  t: any;
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
  t,
  currentUser
}: RoomDialogProps) => {
  
  // Debug logging for invited users
  useEffect(() => {
    if (open && mode === 'edit') {
      console.log('=== ROOM DIALOG DEBUG ===');
      console.log('Mode:', mode);
      console.log('Room data:', roomData);
      console.log('Invited users:', roomData.invitedUsers);
      console.log('Current user:', currentUser);
             if (roomData.invitedUsers) {
         console.log('Invited users details:');
         roomData.invitedUsers.forEach((user: User, index: number) => {
           console.log(`  ${index}: ${user.username || 'no username'} (${user.email || 'no email'}) - ID: ${user._id || 'no id'}`);
           console.log(`    Full user object:`, user);
         });
       }
      console.log('=== END ROOM DIALOG DEBUG ===');
    }
  }, [open, mode, roomData, currentUser]);
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

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mode, setShowSuggestionMenu]);

  const handleAddEmail = () => {
    const email = roomData.inviteEmail?.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // Check if user exists in followedUsers
      const existingUser = followedUsers.find(u => u.email === email);
      const userToAdd = existingUser || {
        _id: `temp-${Date.now()}`,
        email: email,
        username: email.split('@')[0],
        firstName: '',
        lastName: '',
        avatar: ''
      };
      
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
    console.log('=== REMOVE USER DEBUG ===');
    console.log('Removing user at index:', index);
    console.log('Current invited users:', roomData.invitedUsers);
    console.log('User to remove:', roomData.invitedUsers?.[index]);
    
    const updatedInvitedUsers = roomData.invitedUsers?.filter((_: User, i: number) => i !== index);
    console.log('Updated invited users:', updatedInvitedUsers);
    console.log('=== END REMOVE USER DEBUG ===');
    
    onRoomDataChange({
      ...roomData,
      invitedUsers: updatedInvitedUsers
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createNewRoomTitle') : 'Edit Room'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('createNewRoomDesc') : 'Update room settings and details'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor={`${mode}-name`}>
              {mode === 'create' ? t('roomName') : 'Room Name'}
            </label>
            <Input
              id={`${mode}-name`}
              value={roomData.name || ''}
              onChange={(e) => onRoomDataChange({ ...roomData, name: e.target.value })}
              placeholder={mode === 'create' ? t('enterRoomName') : 'Enter room name'}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${mode}-description`}>
              {mode === 'create' ? t('description') : 'Description'}
            </label>
            <Input
              id={`${mode}-description`}
              value={roomData.description || ''}
              onChange={(e) => onRoomDataChange({ ...roomData, description: e.target.value })}
              placeholder={mode === 'create' ? t('enterDescription') : 'Enter room description'}
            />
          </div>
          <div className="grid gap-2 hidden">
            <label htmlFor={`${mode}-maxParticipants`}>
              {mode === 'create' ? t('maxParticipantsLabel') : 'Max Participants'}
            </label>
            <Input
              id={`${mode}-maxParticipants`}
              type="number"
              value={roomData.maxParticipants || 10}
              onChange={(e) => onRoomDataChange({ ...roomData, maxParticipants: parseInt(e.target.value) })}
              min="1"
              max="50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${mode}-isPrivate`}
              checked={roomData.isPrivate || false}
              onCheckedChange={(checked: boolean) => onRoomDataChange({ ...roomData, isPrivate: checked })}
            />
            <label htmlFor={`${mode}-isPrivate`}>
              {mode === 'create' ? t('privateRoom') : 'Private Room'}
            </label>
          </div>
          {roomData.isPrivate && (
            <div className="grid gap-2 relative">
              <label>Invite Users</label>
              <div className="flex gap-2 relative">
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
                  className="flex-grow"
                />
                <Button 
                  variant="secondary"
                  onClick={handleAddEmail}
                >
                  Add
                </Button>

                {/* Suggestion Menu */}
                {showSuggestionMenu && followedUsers.length > 0 && (
                  <div className="suggestion-menu absolute z-10 mt-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      Found {followedUsers.length} followed users
                    </div>
                                         {followedUsers
                       .filter(user => 
                         user.email && // Only users with emails
                         !roomData.invitedUsers?.some((u: User) => u._id === user._id)
                       )
                      .map((user: User) => (
                        <div 
                          key={user._id}
                          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                          onClick={() => handleSuggestionClick(user)}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.avatar || ''} alt={user.username || ''} />
                            <AvatarFallback>
                              {user.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {roomData.invitedUsers && roomData.invitedUsers.length > 0 ? (
                                 <div className="border rounded-md p-2 mt-2">
                   <div className="text-xs text-muted-foreground mb-2">
                     Debug: {roomData.invitedUsers.length} invited users found
                     <br />
                     Users: {roomData.invitedUsers.map(u => `${u.username || 'no username'}(${u.email || 'no email'})[${u._id || 'no id'}]`).join(', ')}
                     <br />
                     Current user: {currentUser?.username} ({currentUser?.email}) - ID: {currentUser?._id}
                   </div>
                                     <div className="flex flex-wrap gap-2 mb-2">
                     {roomData.invitedUsers
                       .filter((user: User) => user._id !== currentUser?._id && user._id) // Hide current user by ID and filter out users without ID
                       .map((user: User, index: number) => {
                         // Find the actual index in the original array (before filtering)
                         const originalIndex = roomData.invitedUsers.findIndex(u => u._id === user._id);
                         if (originalIndex === -1) {
                           console.warn('Could not find user in original array:', user);
                           return null;
                         }
                         return (
                                                        <Badge 
                               key={user._id || user.email || index} 
                               variant="secondary" 
                               className="flex items-center"
                             >
                             {user.email || user.username || `User ${user._id || 'unknown'}`}
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="ml-1 h-4 w-4"
                               onClick={() => handleRemoveUser(originalIndex)}
                             >
                               <X className="h-3 w-3" />
                             </Button>
                           </Badge>
                         );
                       })}
                   </div>
                  <p className="text-xs text-muted-foreground">
                    Invited users will receive an invitation to join the room.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">
                  Debug: No invited users found (invitedUsers: {JSON.stringify(roomData.invitedUsers)})
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {mode === 'create' ? t('cancel') : 'Cancel'}
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isLoading || !roomData.name?.trim()}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : mode === 'create' ? (
              <Plus className="h-4 w-4" />
            ) : null}
            {mode === 'create' ? t('createRoom') : 'Update Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 