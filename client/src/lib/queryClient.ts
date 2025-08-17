import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<any> {
  const { method = 'GET', body, headers = {} } = options || {};
  
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Only add Content-Type for JSON bodies
  if (body && typeof body === 'string') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle empty responses
  const text = await res.text();
  if (!text) return {};
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
