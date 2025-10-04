import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppLayout from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import DailyTaskTracker from '../daily-task-tracker.tsx'
import RichNotes from './pages/RichNotes.jsx'
import { initDatabase } from './db/postgres.js'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DailyTaskTracker /> },
      { path: 'notes', element: <RichNotes /> },
    ],
  },
])

// Initialize database
initDatabase().catch(console.error)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
