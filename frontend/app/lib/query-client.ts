'use client';

import { QueryClient } from '@tanstack/react-query';
import { apiRequest } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return apiRequest(url);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
