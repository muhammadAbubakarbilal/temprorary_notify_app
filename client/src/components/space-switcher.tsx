import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SpaceType = 'personal' | 'professional';

interface SpaceSwitcherProps {
  currentSpace?: SpaceType;
  onSpaceChange?: (space: SpaceType) => void;
  className?: string;
}

export default function SpaceSwitcher({ 
  currentSpace = 'personal', 
  onSpaceChange,
  className = "" 
}: SpaceSwitcherProps) {
  const handleSpaceChange = (value: string) => {
    const space = value as SpaceType;
    if (onSpaceChange) {
      onSpaceChange(space);
    }

    // Trigger refetch of projects and data for the new space
    window.location.reload(); // Simple approach to ensure clean state
  };

  const getSpaceIcon = (space: SpaceType) => {
    return space === 'personal' ? User : Users;
  };

  const getSpaceColor = (space: SpaceType) => {
    return space === 'personal' ? 'bg-blue-500' : 'bg-green-500';
  };

  const getSpaceDisplayName = (space: SpaceType) => {
    return space === 'personal' ? 'Personal' : 'Professional';
  };

  return (
    <Select value={currentSpace} onValueChange={handleSpaceChange}>
      <SelectTrigger className={`w-36 ${className}`}>
        <div className="flex items-center">
          <div className={`w-2 h-2 ${getSpaceColor(currentSpace)} rounded-full mr-2`}></div>
          <SelectValue>
            {getSpaceDisplayName(currentSpace)}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="personal">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <User className="h-4 w-4 mr-2" />
            Personal
          </div>
        </SelectItem>
        <SelectItem value="professional">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <Users className="h-4 w-4 mr-2" />
            Professional
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}