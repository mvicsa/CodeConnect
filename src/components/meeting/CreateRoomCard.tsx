"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateRoomCardProps {
  onCreateRoom: () => void;
  t: any;
}

export const CreateRoomCard = ({ onCreateRoom, t }: CreateRoomCardProps) => {
  return (
    <Card className="flex flex-col dark:border-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {t("createNewRoom")}
        </CardTitle>
        <CardDescription>{t("createNewRoomDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button onClick={onCreateRoom} className="w-full">
          <Plus className="h-4 w-4" />
          {t("createRoom")}
        </Button>
      </CardContent>
    </Card>
  );
}; 