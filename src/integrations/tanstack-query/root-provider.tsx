import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  })
  return { queryClient }
}

export default function TanstackQueryProvider() {}
