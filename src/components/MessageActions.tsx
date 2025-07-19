import React, { useContext } from "react";
import { ChatButton } from "@/components/ui/chat-button";
import { Message } from "@/types/chat";
import { Reply, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SocketContext } from '@/store/Provider';

interface MessageActionsProps {
  message: Message;
  onReply: (message: Message) => void;
  onCopy: (content: string) => void;
  onDelete?: (messageId: string) => void;
  isCurrentUser: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onReply,
  onCopy,
  onDelete,
  isCurrentUser,
}) => {
  const t = useTranslations("chat");
  const socket = useContext(SocketContext);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy(message.content);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(message._id);
    // Real-time: emit delete event to backend
    if (socket && message.chatRoom) {
      socket.emit('chat:delete_message', { roomId: message.chatRoom, messageId: message._id, forAll: true });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChatButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </ChatButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DropdownMenuItem>
        
        {isCurrentUser && onDelete && (
          <DropdownMenuItem 
            onClick={handleDelete}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageActions; 