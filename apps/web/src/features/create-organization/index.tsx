import { SignedIn, CreateOrganization } from '@clerk/clerk-react'

export default function CreateOrganizationPage() {
  return (
    <SignedIn>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px]">
          <CreateOrganization />
        </div>
      </div>
    </SignedIn>
  )
} 