import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Save, FileText, BookOpen, Folder, FolderPlus, X, BarChart3 } from 'lucide-react'
import {
  getRichNotes,
  setRichNotes,
  listRichNotesSections,
  addSection as addSectionDB,
  deleteSection as deleteSectionDB
} from '../db/postgres.js'
import { useAppData } from '../contexts/AppDataContext.jsx'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function RichNotes() {
  // Get shared data from context
  const {
    sections,
    setSections,
    defaultSections,
    isLoading: appLoading,
    richNotesCache,
    setRichNotesCache,
    richNotesSections,
    setRichNotesSections,
    loadRichNotesForSection,
  } = useAppData()

  const [html, setHtml] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSection, setCurrentSection] = useState('personal')
  const [newSectionName, setNewSectionName] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const quillRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const isLoadingContent = useRef(false)
  const previousSection = useRef(currentSection)

  // Load content when section changes
  useEffect(() => {
    const loadContent = async () => {
      // Only load if section actually changed
      if (previousSection.current === currentSection) {
        return
      }

      previousSection.current = currentSection
      isLoadingContent.current = true

      // Check if already cached
      const cachedContent = richNotesCache[currentSection]
      if (cachedContent !== undefined) {
        setHtml(cachedContent)
        setTimeout(() => {
          isLoadingContent.current = false
        }, 100)
      } else {
        // Not cached, load from database
        try {
          const content = await getRichNotes(currentSection)
          const loadedContent = content || ''
          setHtml(loadedContent)
          setRichNotesCache(prev => ({
            ...prev,
            [currentSection]: loadedContent
          }))
          setTimeout(() => {
            isLoadingContent.current = false
          }, 300)
        } catch (error) {
          console.error('Error loading rich notes:', error)
          setHtml('')
          isLoadingContent.current = false
        }
      }
    }

    loadContent()

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [currentSection, setRichNotesCache])

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: () => handleSelectImage(quillRef),
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [])

  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent', 'align',
    'link', 'image', 'video'
  ], [])

  const handleContentChange = useCallback((value) => {
    // Always update the html state to keep editor in sync
    setHtml(value)

    // Don't trigger save if we're just loading content
    if (isLoadingContent.current) {
      return
    }

    // Update cache immediately for instant UI
    setRichNotesCache(prev => ({
      ...prev,
      [currentSection]: value
    }))

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set saving indicator
    setIsSaving(true)

    // Debounce the save operation - wait 1 second after user stops typing
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await setRichNotes(currentSection, value)
        setLastSaved(new Date())

        // Update rich notes sections list if this section has content
        if (value && !richNotesSections.includes(currentSection)) {
          setRichNotesSections(prev => [...prev, currentSection])
        }
      } catch (error) {
        console.error('Error saving rich notes:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }, [currentSection, richNotesSections, setRichNotesCache, setRichNotesSections])

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      await setRichNotes(currentSection, html)
      setLastSaved(new Date())

      // Update rich notes sections list if this section has content
      if (html && !richNotesSections.includes(currentSection)) {
        setRichNotesSections(prev => [...prev, currentSection])
      }
    } catch (error) {
      console.error('Error saving rich notes:', error)
    } finally {
      setIsSaving(false)
    }
  }, [html, currentSection, richNotesSections, setRichNotesSections])

  const handleSwitchSection = (sectionId) => {
    if (sectionId !== currentSection) {
      setCurrentSection(sectionId)
    }
  }

  const addSection = async () => {
    if (newSectionName.trim()) {
      const colors = ['blue', 'green', 'red', 'purple', 'yellow', 'pink', 'indigo']
      const icons = ['📁', '🎯', '⭐', '🔥', '📋', '🎨', '🔧', '📊']
      const randomColor = colors[sections.length % colors.length]
      const randomIcon = icons[sections.length % icons.length]

      try {
        const newSection = await addSectionDB(
          newSectionName.trim(),
          randomColor,
          randomIcon,
          sections.length
        )

        setSections((prev) => [...prev, newSection])
        setNewSectionName('')
        setShowAddSection(false)
        setCurrentSection(newSection.id)
      } catch (error) {
        console.error('Failed to add section:', error)
      }
    }
  }

  const getSectionColor = (colorName, type = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-blue-100 border-blue-300' : 'text-blue-600',
      green: type === 'bg' ? 'bg-green-100 border-green-300' : 'text-green-600',
      red: type === 'bg' ? 'bg-red-100 border-red-300' : 'text-red-600',
      purple: type === 'bg' ? 'bg-purple-100 border-purple-300' : 'text-purple-600',
      yellow: type === 'bg' ? 'bg-yellow-100 border-yellow-300' : 'text-yellow-600',
      pink: type === 'bg' ? 'bg-pink-100 border-pink-300' : 'text-pink-600',
      indigo: type === 'bg' ? 'bg-indigo-100 border-indigo-300' : 'text-indigo-600',
    }
    return colors[colorName] || colors.blue
  }

  if (appLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rich text editor for detailed notes
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isSaving && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-medium">Saving...</span>
                </div>
              )}

              {lastSaved && !isSaving && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Save size={14} />
                  <span className="text-xs font-medium">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}

              <button
                onClick={save}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Save size={14}/>
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {sections.find(s => s.id === currentSection)?.name || 'Unknown'}
                </h2>
                {richNotesSections.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({richNotesSections.length} sections)
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FolderPlus size={14} />
                Add
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSwitchSection(section.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span>{section.name}</span>
                  {richNotesSections.includes(section.id) && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Add Section Form */}
            {showAddSection && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="Enter section name..."
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addSection()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addSection}
                      disabled={!newSectionName.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSection(false)
                        setNewSectionName('')
                      }}
                      className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Editor Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Editor
              </h2>
            </div>
          </div>

          {/* Editor */}
          <div className="rich-notes-editor">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={html}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Start writing your notes here... Use the toolbar for formatting, paste images, add links, and more!"
              style={{ 
                height: 'calc(100vh - 280px)',
                minHeight: '500px'
              }}
            />
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">📝 Formatting</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Use toolbar for rich formatting
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">🖼️ Images</h3>
            <p className="text-xs text-green-700 dark:text-green-300">
              Paste screenshots directly
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">💾 Auto-Save</h3>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Saved automatically as you type
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function handleSelectImage(quillRef) {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/*')
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      const quill = quillRef.current?.getEditor?.()
      const range = quill?.getSelection(true)
      if (quill && range) {
        quill.insertEmbed(range.index, 'image', base64, 'user')
        quill.setSelection(range.index + 1, 0)
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}
