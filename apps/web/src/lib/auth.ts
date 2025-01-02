import { useAuth } from '@clerk/clerk-react'

export function useAuthHeader() {
  const { getToken } = useAuth()

  const getAuthHeader = async () => {
    const token = await getToken()
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  return { getAuthHeader }
} 