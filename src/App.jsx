import { Outlet, Link, useLocation } from 'react-router-dom'
import { StickyNote, BookOpen, LogOut, User } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import { useAppData } from './contexts/AppDataContext'

function App() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { isLoading } = useAppData()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading only on initial app data load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <StickyNote className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Daily Task & Notes
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    location.pathname === '/'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <StickyNote size={16} />
                  <span className="hidden sm:inline">Tasks</span>
                </Link>

                <Link
                  to="/notes"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    location.pathname === '/notes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <BookOpen size={16} />
                  <span className="hidden sm:inline">Notes</span>
                </Link>
              </div>

              {user && (
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <User size={14} />
                    <span className="hidden md:inline">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
