import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Only expose needed Postgres environment variables
    'process.env.POSTGRES_URL': JSON.stringify(process.env.POSTGRES_URL),
    'process.env.POSTGRES_PRISMA_URL': JSON.stringify(process.env.POSTGRES_PRISMA_URL),
    'process.env.POSTGRES_URL_NO_SSL': JSON.stringify(process.env.POSTGRES_URL_NO_SSL),
    'process.env.POSTGRES_URL_NON_POOLING': JSON.stringify(process.env.POSTGRES_URL_NON_POOLING),
  },
})
