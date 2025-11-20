'use client';

import { QueryClient, type QueryFunctionContext } from '@tanstack/react-query';
import { apiRequest } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // explicitly type the parameter to avoid implicit `any` under `strict` mode
      queryFn: async ({ queryKey }: QueryFunctionContext) => {
        const url = queryKey[0] as string;
        return apiRequest(url);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
