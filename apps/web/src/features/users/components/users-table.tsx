import { useUsers } from '../api/users'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleServerError } from '@/utils/handle-server-error'
import { Button } from '@/components/ui/button'

export function UsersTable() {
  const { toast } = useToast()
  const { data, error, isLoading, refetch } = useUsers()

  useEffect(() => {
    if (error) {
      console.error('Users table error:', error)
      toast({
        variant: 'destructive',
        title: handleServerError(error),
      })
    }
  }, [error, toast])

  const handleTestClick = async () => {
    console.log('Test button clicked')
    try {
      const result = await refetch()
      console.log('Refetch result:', {
        data: result.data,
        error: result.error,
        isError: result.isError,
        isSuccess: result.isSuccess,
        status: result.status
      })
    } catch (e) {
      console.error('Error during refetch:', e)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleTestClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Test Fetch Users'}
      </Button>
      {error && (
        <pre className="p-4 bg-destructive/10 text-destructive rounded-md">
          Error: {error.message}
        </pre>
      )}
      {data && (
        <pre className="p-4 bg-muted rounded-md">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
