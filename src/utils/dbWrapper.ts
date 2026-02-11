import { useToast } from '../context/ToastContext'

/**
 * Hook for safe database operations with automatic error handling
 */
export function useDbOperation() {
  const { error: showError } = useToast()

  const safeExecute = async <T,>(
    operation: () => Promise<T>,
    errorMessage: string = 'Database operation failed'
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`DB Error: ${errorMessage}`, err)
      showError(`${errorMessage}: ${message}`)
      return null
    }
  }

  return { safeExecute }
}

/**
 * Standalone wrapper for one-off DB operations (outside of React components)
 */
export async function executeDbOperation<T,>(
  operation: () => Promise<T>,
  showErrorFn?: (msg: string) => void
): Promise<T | null> {
  try {
    return await operation()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('DB Operation failed:', err)
    if (showErrorFn) {
      showErrorFn(`Database error: ${message}`)
    }
    return null
  }
}
