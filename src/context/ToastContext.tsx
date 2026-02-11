import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info' | 'undo'
  duration?: number // ms, 0 = persistent
  onUndo?: () => void
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: 'error' | 'success' | 'info' | 'undo', duration?: number, onUndo?: () => void) => void
  removeToast: (id: string) => void
  error: (message: string) => void
  success: (message: string) => void
  undo: (message: string, onUndo: () => void, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((
    message: string,
    type: 'error' | 'success' | 'info' | 'undo' = 'info',
    duration: number = 4000,
    onUndo?: () => void
  ) => {
    const id = Date.now().toString()
    const toast: Toast = { id, message, type, duration, onUndo }
    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const error = useCallback((message: string) => {
    addToast(message, 'error', 4000)
  }, [addToast])

  const success = useCallback((message: string) => {
    addToast(message, 'success', 3000)
  }, [addToast])

  const undo = useCallback((message: string, onUndo: () => void, duration: number = 6000) => {
    addToast(message, 'undo', duration, onUndo)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, error, success, undo }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
