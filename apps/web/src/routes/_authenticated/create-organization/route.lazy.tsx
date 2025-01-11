import { createLazyFileRoute } from '@tanstack/react-router'
import CreateOrganizationPage from '../../../features/create-organization'

export const Route = createLazyFileRoute('/_authenticated/create-organization')(
  {
    component: CreateOrganizationPage,
  },
)
