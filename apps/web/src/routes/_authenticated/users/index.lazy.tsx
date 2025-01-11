import { createLazyFileRoute } from '@tanstack/react-router'
import { SignedIn } from '@clerk/clerk-react'
import Users from '@/features/users'

export const Route = createLazyFileRoute('/_authenticated/users/')({
  component: () => (
    <SignedIn>
      <Users />
    </SignedIn>
  ),
})
