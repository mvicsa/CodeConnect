"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, RefreshCw } from "lucide-react";

interface JoinMeetingCardProps {
  secretId: string;
  setSecretId: (value: string) => void;
  onJoinRoom: () => void;
  isLoading: boolean;
  t: any;
}

export const JoinMeetingCard = ({ 
  secretId, 
  setSecretId, 
  onJoinRoom, 
  isLoading, 
  t 
}: JoinMeetingCardProps) => {
  return (
    <Card className="dark:border-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {t("joinBySecretId")}
        </CardTitle>
        <CardDescription>{t("joinBySecretIdDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder={t("enterSecretId")}
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
          />
          <Button
            onClick={onJoinRoom}
            disabled={isLoading || !secretId.trim()}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            {t("joinMeetingBtn")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 