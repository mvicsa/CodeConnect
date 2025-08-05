"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Video, Edit, Trash2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Room as ReduxRoom } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";

interface RoomCardProps {
  room: ReduxRoom;
  t: any;
  onCopySecretId: (roomId: string) => void;
  onJoinRoom: (room: ReduxRoom) => void;
  onEditRoom: (room: ReduxRoom) => void;
  onDeleteRoom: (room: ReduxRoom) => void;
  getRoomSecretId: (roomId: string) => Promise<string | null>;
  currentUser?: User;
}

export const RoomCard = ({ 
  room, 
  t, 
  onCopySecretId, 
  onJoinRoom, 
  onEditRoom, 
  onDeleteRoom,
  getRoomSecretId,
  currentUser
}: RoomCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if current user is the creator of this room
  const isCreator = currentUser?._id === room.createdBy._id;

  return (
    <Card className="dark:border-transparent">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold">{room.name}</h3>
              <Badge variant={room.isActive ? "default" : "secondary"}>
                {room.isActive ? t("active") : t("inactive")}
              </Badge>
              <Badge variant={room.isPrivate ? "destructive" : "outline"}>
                {room.isPrivate ? t("private") : t("public")}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-3">
              {room.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center !hidden">
                <Users className="h-4 w-4" />
                {t("maxParticipants")}: {room.maxParticipants}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(room.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => onCopySecretId(room._id)}
            >
              <Copy className="h-4 w-4" />
              {t("copyId")}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const secretId = await getRoomSecretId(room._id);
                if (secretId) {
                  onJoinRoom(room);
                }
              }}
            >
              <Video className="h-4 w-4" />
              {t("join")}
            </Button>
            {isCreator && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRoom(room)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteRoom(room)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 