import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always check for fresh auth state
    gcTime: 0, // Don't cache auth results
  });

  // If there's an auth error, clear all cached data
  useEffect(() => {
    if (error) {
      queryClient.clear();
    }
  }, [error, queryClient]);

  // If there's an auth error or no user data, consider user not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}