/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './daily-task-tracker.tsx',
    ],
    theme: {
        extend: {},
    },
    plugins: [typography],
}
