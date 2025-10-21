import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { cancelRoom } from '@/store/slices/meetingSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CancelRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  onConfirm?: () => void;
}

export const CancelRoomModal: React.FC<CancelRoomModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await dispatch(cancelRoom({ roomId, reason })).unwrap();
      onClose();
      onConfirm?.();
      toast.success('Room cancelled successfully and refunds processed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel room';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Cancel Room</DialogTitle>
        </DialogHeader>
        <p className="mb-4">
          Are you sure you want to cancel &quot;{roomName}&quot;? 
          All participants will be refunded automatically.
        </p>
        
        <div className="mb-4">
          <Label htmlFor="reason" className="block text-sm font-medium mb-2">
            Reason for cancellation (optional):
          </Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter reason for cancellation..."
            // asChild={false} // Ensure it's not treated as a child of another component
          />
        </div>

        <DialogFooter className="flex gap-3 justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isLoading}
            >
              Back
            </Button>
          </DialogClose>
          <Button
            onClick={handleCancel}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
