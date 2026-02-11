import { useToast } from '../context/ToastContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-24 left-4 right-4 space-y-2 pointer-events-none z-50 max-w-md mx-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg pointer-events-auto animate-slideIn ${
            toast.type === 'error'
              ? 'bg-red-100 border border-red-300 text-red-700'
              : toast.type === 'success'
              ? 'bg-green-100 border border-green-300 text-green-700'
              : toast.type === 'undo'
              ? 'bg-blue-100 border border-blue-300 text-blue-700'
              : 'bg-gray-100 border border-gray-300 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{toast.message}</span>
            <div className="flex gap-2">
              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo?.()
                    removeToast(toast.id)
                  }}
                  className="text-xs font-bold px-3 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-100 transition-colors whitespace-nowrap"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
