"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface JoinMeetingCardProps {
  secretId: string;
  setSecretId: (value: string) => void;
  onJoinRoom: () => void;
  isLoading: boolean;
}

export const JoinMeetingCard = ({ 
  secretId, 
  setSecretId, 
  onJoinRoom, 
  isLoading, 
}: JoinMeetingCardProps) => {
  const t = useTranslations("meeting");
  return (
    <Card className="dark:border-transparent h-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("joinBySecretId")}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{t("joinBySecretIdDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        <div className="space-y-2 sm:space-y-3">
          <Input
            placeholder={t("enterSecretId")}
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
            className="text-sm sm:text-base"
          />
          <Button
            onClick={onJoinRoom}
            disabled={isLoading || !secretId.trim()}
            className="w-full h-9 sm:h-10 text-sm sm:text-base"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Video className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="ml-2">{t("joinMeetingBtn")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 