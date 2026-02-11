import { Link } from 'react-router-dom'

interface BottomNavProps {
  currentPath: string
}

function BottomNav({ currentPath }: BottomNavProps) {
  const isActive = (path: string) => {
    return currentPath === path || (path === '/tasks' && currentPath === '/') ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around h-20">
        <Link
          to="/tasks"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${isActive('/tasks')} transition-colors`}
        >
          <span className="text-xl">✓</span>
          <span className="text-xs">Tasks</span>
        </Link>
        <Link
          to="/money"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${isActive('/money')} transition-colors`}
        >
          <span className="text-xl">💰</span>
          <span className="text-xs">Money</span>
        </Link>
        <Link
          to="/contacts"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${isActive('/contacts')} transition-colors`}
        >
          <span className="text-xl">👤</span>
          <span className="text-xs">Contacts</span>
        </Link>
        <Link
          to="/records"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${isActive('/records')} transition-colors`}
        >
          <span className="text-xl">📋</span>
          <span className="text-xs">Records</span>
        </Link>
        <Link
          to="/settings"
          className={`flex-1 flex flex-col items-center justify-center gap-1 ${isActive('/settings')} transition-colors`}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-xs">Settings</span>
        </Link>
      </div>
    </nav>
  )
}

export default BottomNav
