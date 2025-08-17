import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

type FeatureFlags = {
  aiExtraction: boolean;
  recurrence: boolean;
  timeTracking: boolean;
  calendarSync: boolean;
  proNotesVisibilityPolicy: boolean;
};

const defaultFeatureFlags: FeatureFlags = {
  aiExtraction: true,
  recurrence: true,
  timeTracking: true,
  calendarSync: false,
  proNotesVisibilityPolicy: false,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFeatureFlags);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  userId?: string;
  workspaceId?: string;
}

export function FeatureFlagsProvider({ 
  children, 
  userId = "default-user", 
  workspaceId 
}: FeatureFlagsProviderProps) {
  const { data: flags } = useQuery({
    queryKey: ['/api/feature-flags', { userId, workspaceId }],
    queryFn: async () => {
      const params = new URLSearchParams({ userId });
      if (workspaceId) params.append('workspaceId', workspaceId);
      
      const response = await fetch(`/api/feature-flags?${params}`);
      if (!response.ok) return defaultFeatureFlags;
      
      const data = await response.json();
      return {
        aiExtraction: data.ai_extraction ?? defaultFeatureFlags.aiExtraction,
        recurrence: data.recurrence ?? defaultFeatureFlags.recurrence,
        timeTracking: data.time_tracking ?? defaultFeatureFlags.timeTracking,
        calendarSync: data.calendar_sync ?? defaultFeatureFlags.calendarSync,
        proNotesVisibilityPolicy: data.pro_notes_visibility_policy ?? defaultFeatureFlags.proNotesVisibilityPolicy,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const featureFlags = flags || defaultFeatureFlags;

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[flag];
}