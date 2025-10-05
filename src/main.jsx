import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppLayout from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import DailyTaskTracker from '../daily-task-tracker.tsx'
import RichNotes from './pages/RichNotes.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AppDataProvider } from './contexts/AppDataContext.jsx'
import { initDatabase } from './db/postgres.js'

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/signup',
      element: <Signup />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <DailyTaskTracker /> },
        { path: 'notes', element: <RichNotes /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
)

// Initialize database
initDatabase().catch(console.error)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
      </AppDataProvider>
    </AuthProvider>
  </StrictMode>,
)
