# Daily Task & Notes

A modern task management and note-taking application built with React, Vite, and Vercel Postgres.

## Features

- **Task Management**: Create, edit, delete, and organize tasks in different sections
- **Rich Notes**: Section-based rich text editor with image support
- **Responsive Design**: Works great on desktop and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Cloud Storage**: Data stored in Vercel Postgres for reliability and sync

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase Postgres
- **Rich Text**: React Quill
- **Deployment**: Vercel

## Setup Instructions

### 1. Install Dependencies

```sh
npm install
```

### 2. Database Setup

1. Create a Supabase account and project
2. Go to your Supabase project settings and get your API keys
3. Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
SUPABASE_URL="your_supabase_project_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

4. Create the required tables in your Supabase database:

```sql
-- Tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  section TEXT DEFAULT 'personal'
);

-- Notes table
CREATE TABLE notes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  body TEXT NOT NULL DEFAULT ''
);

-- Rich notes table
CREATE TABLE rich_notes (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  markdown TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 3. Run the Application

```sh
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:5173).

## Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add your Supabase environment variables to Vercel's environment settings
4. Deploy!

## Database Schema

The application automatically creates the following tables:

- **tasks**: Stores task data with sections and completion status
- **notes**: Simple text notes storage
- **rich_notes**: Section-based rich text content

## Migration from SQLite

If you're migrating from the previous SQLite version:

1. Export your existing data
2. Follow the setup instructions above
3. The database will be automatically initialized on first run
4. Manually import your data if needed
