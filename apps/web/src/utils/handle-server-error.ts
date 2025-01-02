interface ApiError {
  title: string
  detail?: string
  status: number
}

export function handleServerError(error: unknown): string {
  let errMsg = 'An unexpected error occurred'

  if (error instanceof Error) {
    errMsg = error.message
  } else if (error instanceof Response) {
    errMsg = `HTTP error! status: ${error.status}`
  } else if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError
    errMsg = apiError.title || apiError.detail || errMsg
  }

  return errMsg
}
