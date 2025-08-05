"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Video, Edit, Trash2, Calendar } from "lucide-react";
import { Room as ReduxRoom } from "@/store/slices/meetingSlice";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";

interface RoomCardProps {
  room: ReduxRoom;
  onCopySecretId: (roomId: string) => void;
  onJoinRoom: (room: ReduxRoom) => void;
  onEditRoom: (room: ReduxRoom) => void;
  onDeleteRoom: (room: ReduxRoom) => void;
  getRoomSecretId: (roomId: string) => Promise<string | null>;
  currentUser?: User;
}

export const RoomCard = ({ 
  room, 
  onCopySecretId, 
  onJoinRoom, 
  onEditRoom, 
  onDeleteRoom,
  getRoomSecretId,
  currentUser
}: RoomCardProps) => {
  const t = useTranslations("meeting");
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
    <Card className="dark:border-transparent hover:shadow-md transition-shadow p-6">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate flex-1 min-w-0">
                  {room.name}
                </h3>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Badge variant={room.isActive ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                    {room.isActive ? t("active") : t("inactive")}
                  </Badge>
                  <Badge variant={room.isPrivate ? "destructive" : "outline"} className="text-xs px-1.5 py-0.5">
                    {room.isPrivate ? t("private") : t("public")}
                  </Badge>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                {room.description}
              </p>
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(room.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/50 pt-4">
            <div className="flex flex-1 sm:flex-none items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopySecretId(room._id)}
                className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">{t("copyId")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const secretId = await getRoomSecretId(room._id);
                  if (secretId) {
                    onJoinRoom(room);
                  }
                }}
                className="h-7 sm:h-8 text-xs flex-1 sm:flex-none sm:min-w-[80px]"
              >
                <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">{t("join")}</span>
              </Button>
            </div>
            
            {isCreator && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditRoom(room)}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDeleteRoom(room)}
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 