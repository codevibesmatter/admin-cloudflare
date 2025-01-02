import { Link } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'

export function Sidebar() {
  const { user } = useUser()

  return (
    <aside className="w-64 bg-gray-800 text-white">
      <div className="p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>

        <nav className="space-y-2">
          <Link
            to="/"
            className="block px-4 py-2 rounded hover:bg-gray-700"
            activeProps={{ className: 'bg-gray-700' }}
          >
            Dashboard
          </Link>
          <Link
            to="/users"
            className="block px-4 py-2 rounded hover:bg-gray-700"
            activeProps={{ className: 'bg-gray-700' }}
          >
            Users
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 rounded hover:bg-gray-700"
            activeProps={{ className: 'bg-gray-700' }}
          >
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src={user?.imageUrl}
                alt={user?.fullName || 'User'}
                className="h-8 w-8 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName}
              </p>
              <p className="text-sm text-gray-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
} 