import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from '@/components/ui/toaster'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'
import { SearchProvider } from '@/context/search-context'
import { ErrorBoundary } from '@/components/error-boundary'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <SearchProvider>
        <ErrorBoundary>
          <Outlet />
          <Toaster />
          {import.meta.env.MODE === 'development' && (
            <>
              <ReactQueryDevtools initialIsOpen={false} />
              <TanStackRouterDevtools initialIsOpen={false} />
            </>
          )}
        </ErrorBoundary>
      </SearchProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
