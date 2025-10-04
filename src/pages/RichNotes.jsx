import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Save, FileText, BookOpen, Folder, FolderPlus, X, BarChart3 } from 'lucide-react'
import { getRichNotes, setRichNotes, listRichNotesSections } from '../db/postgres.js'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function RichNotes() {
  const [html, setHtml] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSection, setCurrentSection] = useState('personal')
  const [sections, setSections] = useState([
    { id: "work", name: "Work", color: "blue", icon: "💼" },
    { id: "personal", name: "Personal", color: "green", icon: "🏠" },
    { id: "urgent", name: "Urgent", color: "red", icon: "🚨" },
    { id: "ideas", name: "Ideas", color: "purple", icon: "💡" },
  ])
  const [newSectionName, setNewSectionName] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [richNotesSections, setRichNotesSections] = useState([])
  const quillRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  const loadContent = useCallback(async () => {
    try {
      const content = await getRichNotes(currentSection)
      setHtml(content || '')
    } catch (error) {
      console.error('Error loading rich notes:', error)
    }
  }, [currentSection])

  const loadSections = useCallback(async () => {
    try {
      const dbSections = await listRichNotesSections()
      setRichNotesSections(dbSections)
    } catch (error) {
      console.error('Error loading rich notes sections:', error)
    }
  }, [])

  useEffect(() => {
    loadContent()
    loadSections()

    // Load saved sections from localStorage
    const savedSections = localStorage.getItem('task-sections')
    if (savedSections) {
      try {
        const parsedSections = JSON.parse(savedSections)
        if (Array.isArray(parsedSections) && parsedSections.length > 0) {
          setSections(parsedSections)
        }
      } catch (e) {
        console.error('Failed to parse saved sections:', e)
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [loadContent, loadSections])

  useEffect(() => {
    loadContent()
  }, [loadContent])

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
    setHtml(value)

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
        loadSections() // Refresh sections list
      } catch (error) {
        console.error('Error saving rich notes:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000) // Wait 1 second after last keystroke s
  }, [currentSection, loadSections])

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      await setRichNotes(currentSection, html)
      setLastSaved(new Date())
      loadSections() // Refresh sections list
    } catch (error) {
      console.error('Error saving rich notes:', error)
    } finally {
      setIsSaving(false)
    }
  }, [html, currentSection, loadSections])

  const handleSwitchSection = (sectionId) => {
    if (sectionId !== currentSection) {
      setCurrentSection(sectionId)
    }
  }

  const addSection = () => {
    if (newSectionName.trim()) {
      const colors = ['blue', 'green', 'red', 'purple', 'yellow', 'pink', 'indigo']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      const newSection = {
        id: newSectionName.toLowerCase().replace(/\s+/g, '-'),
        name: newSectionName.trim(),
        color: randomColor,
        icon: '📝'
      }

      const updatedSections = [...sections, newSection]
      setSections(updatedSections)
      localStorage.setItem('task-sections', JSON.stringify(updatedSections))
      
      setNewSectionName('')
      setShowAddSection(false)
      setCurrentSection(newSection.id)
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                {/* <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100">
                  Rich Notes
                </h1> */}
                <p className="text-slate-600 dark:text-slate-400">
                  Section-wise rich text editor for detailed documentation
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isSaving && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Saving...</span>
                </div>
              )}
              
              {lastSaved && !isSaving && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Save size={16} />
                  <span className="text-sm font-medium">
                    Saved at {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}

              <button 
                onClick={save} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Save size={16}/> 
                Save Now
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Section: {sections.find(s => s.id === currentSection)?.name || 'Unknown'}
                </h2>
                {richNotesSections.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>{richNotesSections.length} sections with notes</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <FolderPlus size={16} />
                Add Section
              </button>
            </div>

            {/* Section Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSwitchSection(section.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    currentSection === section.id
                      ? `${getSectionColor(section.color)} text-slate-800 dark:text-slate-200 border-2`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span className="text-base">{section.icon}</span>
                  <span>{section.name}</span>
                  {richNotesSections.includes(section.id) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Editor Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Document Editor
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Perfect for storing code snippets, screenshots, meeting notes, and development logs
                </p>
              </div>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 Formatting</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Use the toolbar for headers, lists, code blocks, and text styling
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">🖼️ Images</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Paste screenshots directly or use the image button in the toolbar
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">💾 Auto-Save</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Your content is automatically saved as you type
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
