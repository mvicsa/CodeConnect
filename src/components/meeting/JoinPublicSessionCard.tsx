"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Video, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface JoinPublicSessionCardProps {
  roomId: string;
  setRoomId: (id: string) => void;
  onJoinSession: () => void;
  isLoading?: boolean;
  isUserInRoom?: boolean;
}

export const JoinPublicSessionCard = ({
  roomId,
  setRoomId,
  onJoinSession,
  isLoading = false,
  isUserInRoom = false,
}: JoinPublicSessionCardProps) => {
  const t = useTranslations("meeting");

  return (
    <Card className="dark:border-transparent gap-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5" />
          {t("joinPublicSession")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("publicSessionDesc")}
        </p>
        
        <div className="space-y-2">
          <label htmlFor="roomId" className="text-sm font-medium">
            Enter Room ID
          </label>
          <Input
            id="roomId"
            type="text"
            placeholder="e.g., 507f1f77bcf86cd799439011"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="font-mono"
          />
        </div>

        <Button
          onClick={onJoinSession}
          disabled={!roomId.trim() || isLoading || isUserInRoom}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Joining...
            </div>
          ) : isUserInRoom ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 text-muted-foreground" />
              Already in a room
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("joinPublicSessionBtn")}
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
