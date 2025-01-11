import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/protected-route'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import SkipToMain from '@/components/skip-to-main'
import Cookies from 'js-cookie'
import { useOnboardingGuard } from '../../features/auth/onboarding'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false'
  useOnboardingGuard()

  return (
    <ProtectedRoute>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <div
            id='content'
            className={cn(
              'max-w-full w-full ml-auto',
              'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
              'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
              'transition-[width] ease-linear duration-200',
              'h-svh flex flex-col',
              'group-data-[scroll-locked=1]/body:h-full',
              'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
            )}
          >
            <Outlet />
          </div>
        </SidebarProvider>
      </SearchProvider>
    </ProtectedRoute>
  )
}
