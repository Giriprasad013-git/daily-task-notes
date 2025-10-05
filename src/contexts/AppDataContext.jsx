import { createContext, useContext, useEffect, useState } from 'react'
import {
  listTasks,
  getNotes,
  listSections,
  getUserPreferences,
  getRichNotes,
  listRichNotesSections,
} from '../db/postgres.js'

const AppDataContext = createContext({})

export const useAppData = () => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }
  return context
}

export const AppDataProvider = ({ children }) => {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState('')
  const [sections, setSections] = useState([])
  const [theme, setTheme] = useState('light')
  const [isLoading, setIsLoading] = useState(true)
  const [richNotesCache, setRichNotesCache] = useState({})
  const [richNotesSections, setRichNotesSections] = useState([])

  const defaultSections = [
    { id: "work", name: "Work", color: "blue", icon: "💼" },
    { id: "personal", name: "Personal", color: "green", icon: "🏠" },
    { id: "urgent", name: "Urgent", color: "red", icon: "🚨" },
    { id: "ideas", name: "Ideas", color: "purple", icon: "💡" },
  ]

  // Helper to load rich notes for a section
  const loadRichNotesForSection = async (sectionId) => {
    try {
      const content = await getRichNotes(sectionId)
      setRichNotesCache(prev => ({
        ...prev,
        [sectionId]: content || ''
      }))
    } catch (error) {
      console.error(`Failed to load rich notes for section ${sectionId}:`, error)
    }
  }

  // Load all data once on app mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, n, s, prefs, rns] = await Promise.all([
          listTasks(),
          getNotes(),
          listSections(),
          getUserPreferences(),
          listRichNotesSections()
        ])

        setTasks(t)
        setNotes(n || '')
        setRichNotesSections(rns || [])

        // Merge default sections with custom sections
        const customSections = s || []
        const allSections = [...defaultSections, ...customSections]
        setSections(allSections)

        // Set theme
        if (prefs?.theme) {
          setTheme(prefs.theme)
          document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
        }

        setIsLoading(false)

        // Preload rich notes for all sections in background
        setTimeout(() => {
          allSections.forEach(section => {
            loadRichNotesForSection(section.id)
          })
        }, 100)
      } catch (error) {
        console.error('Failed to load app data:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Apply theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const value = {
    tasks,
    setTasks,
    notes,
    setNotes,
    sections,
    setSections,
    defaultSections,
    theme,
    setTheme,
    isLoading,
    richNotesCache,
    setRichNotesCache,
    richNotesSections,
    setRichNotesSections,
    loadRichNotesForSection,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
