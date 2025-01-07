import { Button } from '@/components/ui/button'
import { useSyncFromClerk } from '../api/users'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function SyncFromClerkButton() {
  const { toast } = useToast()
  const syncFromClerk = useSyncFromClerk()

  const handleSync = async () => {
    try {
      await syncFromClerk.mutateAsync()
      toast({
        title: 'Success',
        description: 'Users synced successfully from Clerk',
      })
    } catch (error) {
      console.error('Failed to sync from Clerk:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync users from Clerk',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button 
      onClick={handleSync} 
      disabled={syncFromClerk.isPending}
    >
      {syncFromClerk.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        'Sync from Clerk'
      )}
    </Button>
  )
} 