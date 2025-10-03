"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface PublicSessionsSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PublicSessionsSearch = ({
  searchQuery,
  onSearchChange,
}: PublicSessionsSearchProps) => {
  const t = useTranslations("meeting");

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t("searchPublicSessions")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="ps-10"
      />
    </div>
  );
};
