import { supabase } from '../lib/supabase.js'

export async function initDatabase() {
  // No initialization needed - using existing Supabase tables
}

export async function listTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, text, completed, created_at, section')
      .order('id', { ascending: true })

    if (error) throw error

    return data.map(row => ({
      id: parseInt(row.id),
      text: row.text,
      completed: row.completed,
      createdAt: new Date(row.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      section: row.section || 'personal'
    }))
  } catch (error) {
    console.error('Error listing tasks:', error)
    return []
  }
}

export async function addTaskDB(text, section = 'personal') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        text,
        completed: false,
        section,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: parseInt(data.id),
      text: data.text,
      completed: data.completed,
      createdAt: new Date(data.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      section: data.section
    }
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}

export async function toggleTaskDB(id) {
  try {
    // First get the current state
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Toggle the completed state
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !currentTask.completed })
      .eq('id', id)
      .select('completed')
      .single()

    if (error) throw error

    return data.completed
  } catch (error) {
    console.error('Error toggling task:', error)
    throw error
  }
}

export async function deleteTaskDB(id) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

export async function editTaskDB(id, text) {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ text })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error editing task:', error)
    throw error
  }
}

export async function updateTaskSectionDB(id, section) {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ section })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error updating task section:', error)
    throw error
  }
}

export async function getNotes() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ''

    const { data, error } = await supabase
      .from('notes')
      .select('body')
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting notes:', error)
      return ''
    }

    return data?.body || ''
  } catch (error) {
    console.error('Error getting notes:', error)
    return ''
  }
}

export async function setNotes(body) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('notes')
      .upsert({ user_id: user.id, body }, { onConflict: 'user_id' })

    if (error) throw error
  } catch (error) {
    console.error('Error setting notes:', error)
    throw error
  }
}

export async function getRichNotes(section = 'personal') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ''

    const { data, error } = await supabase
      .from('rich_notes')
      .select('markdown')
      .eq('section', section)
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting rich notes:', error)
      return ''
    }

    return data?.markdown || ''
  } catch (error) {
    console.error('Error getting rich notes:', error)
    return ''
  }
}

export async function setRichNotes(section = 'personal', markdown) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('rich_notes')
      .upsert({
        id: `${user.id}_${section}`,
        user_id: user.id,
        section,
        markdown,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'user_id,section'
      })

    if (error) throw error
  } catch (error) {
    console.error('Error setting rich notes:', error)
    throw error
  }
}

export async function listRichNotesSections() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('rich_notes')
      .select('section, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error listing rich notes sections:', error)
      return []
    }

    return data?.map(row => row.section) || []
  } catch (error) {
    console.error('Error listing rich notes sections:', error)
    return []
  }
}

export async function deleteRichNotesSection(section) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('rich_notes')
      .delete()
      .eq('section', section)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting rich notes section:', error)
    throw error
  }
}

// Sections Management
export async function listSections() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('sections')
      .select('id, name, color, icon, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error listing sections:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error listing sections:', error)
    return []
  }
}

export async function addSection(name, color, icon, sortOrder = 0) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const id = name.toLowerCase().replace(/\s+/g, '-')

    const { data, error } = await supabase
      .from('sections')
      .insert({
        id: `${user.id}_${id}`,
        user_id: user.id,
        name,
        color,
        icon,
        sort_order: sortOrder
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      sort_order: data.sort_order
    }
  } catch (error) {
    console.error('Error adding section:', error)
    throw error
  }
}

export async function deleteSection(sectionId) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting section:', error)
    throw error
  }
}

export async function updateSectionOrder(sections) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updates = sections.map((section, index) => ({
      id: section.id,
      user_id: user.id,
      name: section.name,
      color: section.color,
      icon: section.icon,
      sort_order: index
    }))

    const { error } = await supabase
      .from('sections')
      .upsert(updates)

    if (error) throw error
  } catch (error) {
    console.error('Error updating section order:', error)
    throw error
  }
}

// User Preferences Management
export async function getUserPreferences() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { theme: 'light' }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('theme')
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user preferences:', error)
      return { theme: 'light' }
    }

    return data || { theme: 'light' }
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return { theme: 'light' }
  }
}

export async function setUserPreferences(theme) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        theme,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) throw error
  } catch (error) {
    console.error('Error setting user preferences:', error)
    throw error
  }
}

export const persistDB = async () => {
  // No-op for Supabase since it persists automatically
}