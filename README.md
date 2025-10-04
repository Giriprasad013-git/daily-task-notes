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
- **Database**: Vercel Postgres
- **Rich Text**: React Quill
- **Deployment**: Vercel

## Setup Instructions

### 1. Install Dependencies

```sh
npm install
```

### 2. Database Setup

1. Create a Vercel account and project
2. Add a Postgres database to your Vercel project
3. Copy the environment variables from your Vercel dashboard (Storage > Postgres > .env.local tab)
4. Create a `.env.local` file in the root directory and add your database credentials:

```env
POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_prisma_url"
POSTGRES_URL_NO_SSL="your_no_ssl_url"
POSTGRES_URL_NON_POOLING="your_non_pooling_url"
POSTGRES_USER="your_user"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_database"
```

### 3. Run the Application

```sh
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:5173).

## Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect the environment variables from your Postgres database
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
