"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface CreateRoomCardProps {
  onCreateRoom: () => void;
  isLoading?: boolean;
}

export const CreateRoomCard = ({ onCreateRoom, isLoading = false }: CreateRoomCardProps) => {
  const t = useTranslations("meeting");
  return (
    <Card className="flex flex-col dark:border-transparent h-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("createNewRoom")}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{t("createNewRoomDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Button 
          onClick={onCreateRoom} 
          disabled={isLoading}
          className="w-full h-9 sm:h-10 text-sm sm:text-base"
        >
          {isLoading ? (
            <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span>
            {isLoading ? "Creating..." : t("createRoom")}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}; 