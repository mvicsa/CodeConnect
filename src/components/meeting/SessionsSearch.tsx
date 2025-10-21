"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { debounce } from 'lodash';

interface SessionsSearchProps {
  onSearchChange: (query: string) => void;
  resetSearch?: boolean;
}

export const SessionsSearch: React.FC<SessionsSearchProps> = ({ 
  onSearchChange, 
  resetSearch = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search function
  const debouncedSearch = debounce((query: string) => {
    onSearchChange(query);
  }, 500); // 500ms delay

  // Reset search when resetSearch prop changes
  useEffect(() => {
    if (resetSearch) {
      setSearchQuery('');
      debouncedSearch.cancel(); // Cancel any pending search
      onSearchChange('');
    }
  }, [resetSearch, onSearchChange, debouncedSearch]);

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
    <div className="relative grow-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search sessions..."
        value={searchQuery}
        onChange={(e) => handleInputChange(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  );
};