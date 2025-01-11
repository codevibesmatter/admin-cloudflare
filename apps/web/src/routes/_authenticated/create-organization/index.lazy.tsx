import { createLazyFileRoute } from '@tanstack/react-router'
import CreateOrganizationPage from '../../../features/create-organization'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated/create-organization/': {
      id: '/_authenticated/create-organization/'
      path: '/create-organization'
      fullPath: '/create-organization'
    }
  }
}

export const Route = createLazyFileRoute('/_authenticated/create-organization/')({
  component: CreateOrganizationPage,
}) 