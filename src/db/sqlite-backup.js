// Client-side SQLite using sql.js with IndexedDB persistence
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const DB_NAME = 'daily_task_and_notes_db'
const DB_STORE_KEY = 'db_blob'

function idb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains('kv')) {
                db.createObjectStore('kv')
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function idbGet(key) {
    const db = await idb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readonly')
        const store = tx.objectStore('kv')
        const req = store.get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
    })
}

async function idbSet(key, value) {
    const db = await idb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readwrite')
        const store = tx.objectStore('kv')
        const req = store.put(value, key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })
}

let SQLPromise
let DatabasePromise

export async function getDB() {
    if (!SQLPromise) {
        SQLPromise = initSqlJs({
            locateFile: () => wasmUrl,
        })
    }
    const SQL = await SQLPromise
    if (DatabasePromise) return DatabasePromise

    DatabasePromise = (async () => {
        const saved = await idbGet(DB_STORE_KEY)
        const db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database()
                        // Schema
        db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        text TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        section TEXT DEFAULT 'personal'
      );
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        body TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS rich_notes (
        id TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        markdown TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO notes (id, body) VALUES (1, '');
    `)

        // Check if tasks table needs section column
        const tableInfo = db.exec('PRAGMA table_info(tasks)')
        const hasSection = tableInfo.length > 0 && 
          tableInfo[0].values.some(row => row[1] === 'section')
        
        if (!hasSection) {
          db.exec('ALTER TABLE tasks ADD COLUMN section TEXT DEFAULT "personal"')
          db.exec('UPDATE tasks SET section = "personal" WHERE section IS NULL')
        }

        // Handle rich_notes table migration
        const richNotesInfo = db.exec('PRAGMA table_info(rich_notes)')
        const hasOldStructure = richNotesInfo.length > 0 && 
          richNotesInfo[0].values.some(row => row[1] === 'id' && row[2].includes('INTEGER'))
        
        if (hasOldStructure) {
          // Migrate old rich_notes structure to new section-based structure
          const oldContent = db.exec('SELECT markdown FROM rich_notes WHERE id = 1')
          const content = oldContent.length > 0 ? oldContent[0].values[0][0] : ''
          
          // Drop old table and recreate with new structure
          db.exec('DROP TABLE rich_notes')
          db.exec(`
            CREATE TABLE rich_notes (
              id TEXT PRIMARY KEY,
              section TEXT NOT NULL,
              markdown TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `)
          
          // Insert migrated content into personal section if there was content
          if (content) {
            const now = new Date().toISOString()
            db.run('INSERT INTO rich_notes (id, section, markdown, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', 
              ['personal', 'personal', content, now, now])
          }
        }

        return db
    })()

    return DatabasePromise
}

        // Check if tasks table needs section column
        const tableInfo = db.exec('PRAGMA table_info(tasks)')
        const hasSection = tableInfo.length > 0 && 
          tableInfo[0].values.some(row => row[1] === 'section')
        
        if (!hasSection) {
          db.exec('ALTER TABLE tasks ADD COLUMN section TEXT DEFAULT "personal"')
          db.exec('UPDATE tasks SET section = "personal" WHERE section IS NULL')
        }

        // Handle rich_notes table migration
        const richNotesInfo = db.exec('PRAGMA table_info(rich_notes)')
        const hasOldStructure = richNotesInfo.length > 0 && 
          richNotesInfo[0].values.some(row => row[1] === 'id' && row[2].includes('INTEGER'))
        
        if (hasOldStructure) {
          // Migrate old rich_notes structure to new section-based structure
          const oldContent = db.exec('SELECT markdown FROM rich_notes WHERE id = 1')
          const content = oldContent.length > 0 ? oldContent[0].values[0][0] : ''
          
          // Drop old table and recreate with new structure
          db.exec('DROP TABLE rich_notes')
          db.exec(`
            CREATE TABLE rich_notes (
              id TEXT PRIMARY KEY,
              section TEXT NOT NULL,
              markdown TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `)
          
          // Insert migrated content into personal section if there was content
          if (content) {
            const now = new Date().toISOString()
            db.run('INSERT INTO rich_notes (id, section, markdown, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', 
              ['personal', 'personal', content, now, now])
          }
        }

        // Handle rich_notes table migration
        const richNotesInfo = db.exec('PRAGMA table_info(rich_notes)')
        const hasOldStructure = richNotesInfo.length > 0 && 
          richNotesInfo[0].values.some(row => row[1] === 'id' && row[2].includes('INTEGER'))
        
        if (hasOldStructure) {
          // Migrate old rich_notes structure to new section-based structure
          const oldContent = db.exec('SELECT markdown FROM rich_notes WHERE id = 1')
          const content = oldContent.length > 0 ? oldContent[0].values[0][0] : ''
          
          // Drop old table and recreate with new structure
          db.exec('DROP TABLE rich_notes')
          db.exec(`
            CREATE TABLE rich_notes (
              id TEXT PRIMARY KEY,
              section TEXT NOT NULL,
              markdown TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `)
          
          // Insert migrated content into personal section if there was content
          if (content) {
            const now = new Date().toISOString()
            db.run('INSERT INTO rich_notes (id, section, markdown, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', 
              ['personal', 'personal', content, now, now])
          }
        }
      
      -- Add section column to existing tasks table if it doesn't exist
      PRAGMA table_info(tasks);
    `)

        // Check if section column exists and add it if missing
        const tableInfo = db.exec('PRAGMA table_info(tasks)')
        const hasSection = tableInfo.length > 0 && 
          tableInfo[0].values.some(row => row[1] === 'section')
        
        if (!hasSection) {
          db.exec('ALTER TABLE tasks ADD COLUMN section TEXT DEFAULT "personal"')
          // Update existing tasks to have a default section
          db.exec('UPDATE tasks SET section = "personal" WHERE section IS NULL')
        }

        return db
    })()

    return DatabasePromise
}

export async function persistDB() {
    const db = await getDB()
    const data = db.export()
    await idbSet(DB_STORE_KEY, data)
}

// CRUD helpers
export async function listTasks() {
    const db = await getDB()
    const res = db.exec('SELECT id, text, completed, createdAt, section FROM tasks ORDER BY id ASC')
    if (res.length === 0) return []
    const rows = res[0]
    return rows.values.map(([id, text, completed, createdAt, section]) => ({ 
        id, 
        text, 
        completed: !!completed, 
        createdAt,
        section: section || 'personal'
    }))
}

export async function addTaskDB(text, section = 'personal') {
    const db = await getDB()
    const createdAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const id = Date.now()
    db.run('INSERT INTO tasks (id, text, completed, createdAt, section) VALUES (?, ?, 0, ?, ?)', [id, text, createdAt, section])
    await persistDB()
    return { id, text, completed: false, createdAt, section }
}

export async function toggleTaskDB(id) {
    const db = await getDB()
    const current = db.exec('SELECT completed FROM tasks WHERE id = ?', [id])
    const completed = current.length ? current[0].values[0][0] : 0
    const next = completed ? 0 : 1
    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [next, id])
    await persistDB()
    return !!next
}

export async function deleteTaskDB(id) {
    const db = await getDB()
    db.run('DELETE FROM tasks WHERE id = ?', [id])
    await persistDB()
}

export async function editTaskDB(id, text) {
    const db = await getDB()
    db.run('UPDATE tasks SET text = ? WHERE id = ?', [text, id])
    await persistDB()
}

export async function updateTaskSectionDB(id, section) {
    const db = await getDB()
    db.run('UPDATE tasks SET section = ? WHERE id = ?', [section, id])
    await persistDB()
}

export async function getNotes() {
    const db = await getDB()
    const res = db.exec('SELECT body FROM notes WHERE id = 1')
    return res.length ? res[0].values[0][0] : ''
}

export async function setNotes(body) {
    const db = await getDB()
    db.run('UPDATE notes SET body = ? WHERE id = 1', [body])
    await persistDB()
}

export async function getRichNotes() {
    const db = await getDB()
    const res = db.exec('SELECT markdown FROM rich_notes WHERE id = 1')
    return res.length ? res[0].values[0][0] : ''
}

export async function setRichNotes(markdown) {
    const db = await getDB()
    db.run('UPDATE rich_notes SET markdown = ? WHERE id = 1', [markdown])
    await persistDB()
}
