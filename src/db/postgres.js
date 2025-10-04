import { sql } from '@vercel/postgres'

export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGSERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        section TEXT DEFAULT 'personal'
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY DEFAULT 1,
        body TEXT NOT NULL DEFAULT '',
        CONSTRAINT single_note CHECK (id = 1)
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS rich_notes (
        id TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        markdown TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `

    const notesCount = await sql`SELECT COUNT(*) FROM notes WHERE id = 1`
    if (notesCount.rows[0].count === '0') {
      await sql`INSERT INTO notes (id, body) VALUES (1, '')`
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

export async function listTasks() {
  try {
    const result = await sql`
      SELECT id, text, completed, created_at, section
      FROM tasks
      ORDER BY id ASC
    `

    return result.rows.map(row => ({
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
    const result = await sql`
      INSERT INTO tasks (text, completed, section)
      VALUES (${text}, FALSE, ${section})
      RETURNING id, text, completed, created_at, section
    `

    const row = result.rows[0]
    return {
      id: parseInt(row.id),
      text: row.text,
      completed: row.completed,
      createdAt: new Date(row.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      section: row.section
    }
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}

export async function toggleTaskDB(id) {
  try {
    const result = await sql`
      UPDATE tasks
      SET completed = NOT completed
      WHERE id = ${id}
      RETURNING completed
    `

    return result.rows[0]?.completed || false
  } catch (error) {
    console.error('Error toggling task:', error)
    throw error
  }
}

export async function deleteTaskDB(id) {
  try {
    await sql`DELETE FROM tasks WHERE id = ${id}`
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

export async function editTaskDB(id, text) {
  try {
    await sql`UPDATE tasks SET text = ${text} WHERE id = ${id}`
  } catch (error) {
    console.error('Error editing task:', error)
    throw error
  }
}

export async function updateTaskSectionDB(id, section) {
  try {
    await sql`UPDATE tasks SET section = ${section} WHERE id = ${id}`
  } catch (error) {
    console.error('Error updating task section:', error)
    throw error
  }
}

export async function getNotes() {
  try {
    const result = await sql`SELECT body FROM notes WHERE id = 1`
    return result.rows[0]?.body || ''
  } catch (error) {
    console.error('Error getting notes:', error)
    return ''
  }
}

export async function setNotes(body) {
  try {
    await sql`UPDATE notes SET body = ${body} WHERE id = 1`
  } catch (error) {
    console.error('Error setting notes:', error)
    throw error
  }
}

export async function getRichNotes(section = 'personal') {
  try {
    const result = await sql`
      SELECT markdown
      FROM rich_notes
      WHERE section = ${section}
    `
    return result.rows[0]?.markdown || ''
  } catch (error) {
    console.error('Error getting rich notes:', error)
    return ''
  }
}

export async function setRichNotes(section = 'personal', markdown) {
  try {
    const now = new Date().toISOString()

    const existing = await sql`
      SELECT id FROM rich_notes WHERE section = ${section}
    `

    if (existing.rows.length > 0) {
      await sql`
        UPDATE rich_notes
        SET markdown = ${markdown}, updated_at = ${now}
        WHERE section = ${section}
      `
    } else {
      await sql`
        INSERT INTO rich_notes (id, section, markdown, created_at, updated_at)
        VALUES (${section}, ${section}, ${markdown}, ${now}, ${now})
      `
    }
  } catch (error) {
    console.error('Error setting rich notes:', error)
    throw error
  }
}

export async function listRichNotesSections() {
  try {
    const result = await sql`
      SELECT section, created_at, updated_at
      FROM rich_notes
      ORDER BY updated_at DESC
    `

    return result.rows.map(row => ({
      section: row.section,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error) {
    console.error('Error listing rich notes sections:', error)
    return []
  }
}

export async function deleteRichNotesSection(section) {
  try {
    await sql`DELETE FROM rich_notes WHERE section = ${section}`
  } catch (error) {
    console.error('Error deleting rich notes section:', error)
    throw error
  }
}

export const persistDB = async () => {
}