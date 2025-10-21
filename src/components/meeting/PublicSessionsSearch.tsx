"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { debounce } from 'lodash';

interface PublicSessionsSearchProps {
  onSearchChange: (query: string) => void;
}

export const PublicSessionsSearch: React.FC<PublicSessionsSearchProps> = ({ onSearchChange }) => {
  const t = useTranslations("meeting");
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search function
  const debouncedSearch = debounce((query: string) => {
    onSearchChange(query);
  }, 500); // 500ms delay

  // Handle input change
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Only trigger debounced search if there's a value
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      // If input is empty, immediately call onSearchChange with empty string
      debouncedSearch.cancel(); // Cancel any pending search
      onSearchChange('');
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t("searchPublicSessions")}
        value={searchQuery}
        onChange={(e) => handleInputChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};